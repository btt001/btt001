var HTTPRequest = {
	AjaxStartCallback: null,
	AjaxStopCallback: null,
	processedCallback: null,
	newRequestCallback: null,
	defaultTag: 'untagged',
	
	setAjaxStart: function(callback)
	{
		this.AjaxStartCallback = callback;
	},
	setAjaxStop: function(callback)
	{
		this.AjaxStopCallback = callback;
	},
	setProcessedCallback: function(callback)
	{
		this.processedCallback = callback;
	},
	setnewRequestCallback: function(callback)
	{
		this.newRequestCallback = callback;
	},
	post: function (url, data, callback, options)
	{
		var parameters = {
			METHOD: 'POST',
			data: data
		};

		var request_parms = this._mergeobjs(options, parameters);
		return this.request(url, request_parms, callback, options);
	},
	put: function (url, data, callback, options)
	{
		var parameters = {
			METHOD: 'PUT',
			data: data
		};

		var request_parms = this._mergeobjs(options, parameters);
		return this.request(url, request_parms, callback, options);
	},
	get: function (url, callback, options)
	{
		var parameters = {
			METHOD: 'GET'
		};

		var request_parms = this._mergeobjs(options, parameters);
		return this.request(url, request_parms, callback);
	},
	del: function (url, callback, options)
	{
		var parameters = {
			METHOD: 'DELETE'
		};

		var request_parms = this._mergeobjs(options, parameters);
		return this.request(url, request_parms, callback);
	},
	request: function (url, parameters, callback)
	{
		parameters = this._key2lower(parameters);
		
		if (typeof parameters.method === 'undefined')
		{
			parameters.method = 'GET';
		}

		if (typeof parameters.datatype === 'string')
		{
			parameters.datatype = parameters.datatype.toLowerCase();

			var vaild_types = ['json'];

			if (vaild_types.indexOf(parameters.datatype) === -1)
			{
				throw ('Invalid datatype option');
			}
		}
		else
		{
			parameters.datatype = null;
		}
		
		//data
		if (typeof parameters.data !== 'undefined')
		{
			parameters.data = this._objToQuery(parameters.data);
		}
		
		if (typeof parameters.query !== 'undefined')
		{
			parameters.query = this._objToQuery(parameters.query);
			if (url.indexOf('?') !== -1)
			{
				url += '&' + parameters.query;
			}
			else
			{
				url += '?' + parameters.query;
			}
		}

		//do XHR
		var xhr = this._getXHR();
		var newID = this._grabNewID();
		
		var currentTag = this.defaultTag;
		
		if (typeof parameters.tag == 'string')
		{
			currentTag = parameters.tag;
		}
		
		this._pendingXHRs[newID] = {
			xhr:xhr,
			tag: currentTag
		};
		
		if (typeof this._TAGS[currentTag] != 'object')
		{
			this._TAGS[currentTag] = {};	
		}
		
		this._TAGS[currentTag][newID] = null;
		
		if (this.newRequestCallback != undefined)
		{
			this.newRequestCallback(currentTag, newID);
		}
		
		if (this._numKeys(this._pendingXHRs) == 1)
		{
			if (this.AjaxStartCallback != undefined)
			{
				this.AjaxStartCallback();
			}
		}
		
		this._processXHR(xhr, newID, parameters, url, callback);
		return newID;
	},
	stopID: function (id)
	{
		if (typeof this._pendingXHRs[id] == 'object')
		{
			if (this._pendingXHRs[id].xhr == null)
			{
				this._processdID(id);
			}
			else
			{
				this._abortedXHRs.push(this._pendingXHRs[id].xhr);
				this._pendingXHRs[id].xhr.abort();
			}
		}
	},
	stopAll: function()
	{
		for (var key in this._pendingXHRs)
		{
			if (this._pendingXHRs.hasOwnProperty(key))
			{
				this.stopID(key);
			}
		}	
	},
	stopTag: function(tag)
	{
		if (typeof this._TAGS[tag] == 'object')
		{
			for (var key in this._TAGS[tag])
			{
				this.stopID(key);
			}
		}
	},
	encode: function (str)
	{
		str = (str + '').toString();
		return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
				replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
	},
	decode: function (str)
	{
	return decodeURIComponent((str + '').replace(/\+/g, '%20'));
		},

		rvalidchars: /^[\],:{}\s]*$/,
		rvalidescape: /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
		rvalidtokens: /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
		rvalidbraces: /(?:^|:|,)(?:\s*\[)+/g,
		parseJSON: function (data)
		{
			try
			{
				if (typeof exports === 'object' && exports) //This is a module, use native JSON parser
				{
					return JSON.parse(data);
				}
				else
				{
					if (typeof data !== "string" || !data)
					{
						return null;
					}
	
					data = this.trim(data);
					if (window.JSON && window.JSON.parse)
					{
						return window.JSON.parse(data);
					}

					if (rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, "")))
					{
						return (new Function("return " + data))();
					}
				}
			}
			catch (e)
			{
				return null;
			}
		},
		trim: function (str, charlist)
		{
			var whitespace, l = 0,
				i = 0;
			str += '';
	
			if (!charlist)
			{
				whitespace = " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
			}
			else
			{
				charlist += '';
				whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
			}
	
			l = str.length;
			for (i = 0; i < l; i++)
			{
				if (whitespace.indexOf(str.charAt(i)) === -1)
				{
					str = str.substring(i);
					break;
				}
			}
	
			l = str.length;
			for (i = l - 1; i >= 0; i--)
			{
				if (whitespace.indexOf(str.charAt(i)) === -1)
				{
					str = str.substring(0, i + 1);
					break;
				}
			}
	
			return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
		},
		//Private
		_pendingXHRs: {},
		_TAGS: {},
		_abortedXHRs: [],
		_processdID: function(id)
		{	
			var tag = this._pendingXHRs[id].tag;
			if (this.processedCallback != undefined)
			{
				this.processedCallback(tag, id);
			}
			
			delete this._TAGS[tag][id];
			
			if (this._TAGS[tag].length == 0)
			{
				delete this._TAGS[tag];
			}
			
			delete this._pendingXHRs[id];
		},
		_processXHR: function(xhr, id, parameters, url, callback)
		{
			if (xhr == null)
			{
				this._processdID(id);
				
				callback(0, {}, null);
				this._stopAjaxLoader();
			}
			else
			{
				var that = this;
				xhr.onreadystatechange = function ()
				{
					if (xhr.readyState === 4) //HTTP results!
					{
						if (that._abortedXHRs.indexOf(xhr) >= 0)
						{
							that._abortedXHRs.splice(that._abortedXHRs.indexOf(xhr), 1);
						}
						else
						{
							if (parameters.datatype === 'json') //json
							{
								callback(xhr.status, that._headersToHeaders(xhr.getAllResponseHeaders()), that.parseJSON(xhr.responseText));
							}
							else //other
							{
								callback(xhr.status, that._headersToHeaders(xhr.getAllResponseHeaders()), xhr.responseText);
							}
						}
						
						that._processdID(id);
						that._stopAjaxLoader();
					}
				};
	
				xhr.open(parameters.method, url, true);
				if (typeof exports === 'object' && exports)
				{
					xhr.disableHeaderCheck(true);
					if (typeof parameters.useragent !== 'undefined')
					{
						xhr.setRequestHeader('User-Agent', parameters.useragent);
					}
	
					if (typeof parameters.headers === 'object')
					{
						for (var key in parameters.headers)
						{
							if (parameters.headers.hasOwnProperty(key))
							{
								xhr.setRequestHeader(key, parameters.headers[key]);
							}
						}
					}
				}
	
				if (parameters.method === 'POST' || parameters.method === 'PUT')
				{
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				}
				
				if (parameters.method === 'POST' || parameters.method === 'PUT')
				{
					if (typeof parameters.data !== 'undefined')
					{
						xhr.send(parameters.data);
					}
					else
					{
						xhr.send();
					}
				}
				else
				{
					xhr.send();
				}
			}
		},
		_lastID: 1,
		_grabNewID: function()
		{
			return this._lastID++;
		},
		_stopAjaxLoader: function()
		{
			if (this._numKeys(this._pendingXHRs) == 0)
			{
				if (this.AjaxStopCallback != undefined)
				{
					this.AjaxStopCallback();
				}
			}
		},
		_objToQuery: function (obj)
		{
			if (typeof obj === 'object')
			{
				var str = [];
				for (var key in obj)
				{
					if (obj.hasOwnProperty(key))
					{
						str.push(this.encode(key) + '=' + this.encode(obj[key]));
					}
				}
				return str.join('&');
			}
			else
			{
				return obj;
			}
		},
		_headersToHeaders: function (headers_str)
		{
			if (headers_str.indexOf('\n') !== -1)
			{
				var headers_list = headers_str.split('\n');
	
				var header_obj = {};
				for (var key in headers_list)
				{
					if (headers_list.hasOwnProperty(key))
					{
						var header = headers_list[key].replace(/\r/g, '');
	
						if (header.indexOf(':') !== -1)
						{
							var firstcharpos = this._firstcharpos(header, ':');
	
							var field = header.substring(0, firstcharpos).toLowerCase();
							var value = header.substring(firstcharpos);
							value = value.substring(2);
	
							header_obj[field] = value;
						}
					}
				}
				return header_obj;
			}
			else
			{
				return {};
			}
		},
		_firstcharpos: function (string, c)
		{
			var letters = string.split('');
			for (var key in letters)
			{
				if (letters[key] === c)
				{
					return key;
				}
			}
			return null;
		},
		_numKeys: function(obj)
		{
		    var count = 0;
		    for(var prop in obj)
		    {
		        count++;
		    }
		    return count;
		},
		_getXHR: function ()
		{
			if (typeof exports === 'object' && exports)
			{
				XMLHttpRequest = require('./lib/XMLHttpRequest.js').XMLHttpRequest; 
				return new XMLHttpRequest();
			}
			else
			{
				if (window.XMLHttpRequest)
				{
					return new XMLHttpRequest();
				}
				// IE6
				try
				{
					return new ActiveXObject('MSXML2.XMLHTTP.6.0');
				}
				catch (e)
				{
					try
					{
						return new ActiveXObject('MSXML2.XMLHTTP.3.0');
					}
					catch (e)
					{
						return null;
					}
				}
			}
		},
		_key2lower: function (obj)
		{
			if (typeof obj === 'object')
			{
				var newobj = {};
				for (var attrname in obj)
				{
					if (obj.hasOwnProperty(attrname))
					{
						newobj[attrname.toLowerCase()] = obj[attrname];
					}
				}
				return newobj;
			}
			else
			{
				return {};
			}
		},
		_mergeobjs: function (obj1, obj2)
		{
			if (typeof obj1 !== 'object')
			{
				obj1 = {};
			}
	
			if (typeof obj2 !== 'object')
			{
				obj2 = {};
			}
			//Merge
			var obj3 = {};
			for (var attrname in obj1)
			{
				if (obj1.hasOwnProperty(attrname))
				{
					obj3[attrname] = obj1[attrname];
				}
			}
	
			for (var attrname2 in obj2)
			{
				if (obj2.hasOwnProperty(attrname2))
				{
					obj3[attrname2] = obj2[attrname2];
				}
			}
			return obj3;
		}
	};

if (typeof exports === 'object' && exports)
{
	module.exports = HTTPRequest;
}

if (typeof define === 'function' && define.amd)
{
	define(HTTPRequest);
}
