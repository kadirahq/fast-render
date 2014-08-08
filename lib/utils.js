FastRender = {
	EncodeEJSON: function(ejson) {
		var ejsonString = EJSON.stringify(ejson);
		return encodeURI(ejsonString);
	},
	DecodeEJSON: function(encodedEjson) {
		var decodedEjsonString = decodeURI(encodedEjson);
		return EJSON.fromJSONValue(JSON.parse(decodedEjsonString));
	}
}

EncodeEJSON = function(ejson) {
	return FastRender.EncodeEJSON(ejson);
}

DecodeEJSON = function(ejson) {
	return FastRender.DecodeEJSON(ejson);
}
