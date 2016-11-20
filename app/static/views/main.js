$(document).ready(function () {
	LoadNetwork();

	$("#logPanel").hide();

	$("#go").click(function () {
		DoSearch();
	});

	$('#searchText').keydown(function (event) {
		if (event.keyCode == 13 || event.which == 13) {
			DoSearch();
		}
	});

	$("#logPrevious").click(function () {
		FetchLog("<");
	});
	$("#logNext").click(function () {

		FetchLog(">");
	});

	marks = ["mark0", "mark1", "mark2", "mark3", "mark4"];
});
var networks; // networks linked to the user
var buffers; // buffers for the selected network 

var searchResults; // datatable with query search results
var searchedWords; // array containing searched words input
var logContent; // JSon log content 

var context; // query context switcher ( regex vs plain text and so on)

function IsQueryARegex() {
	var b = $("#isRegex").is(":checked");
	return b;
}

function GetNetwork(networkId) {
	var tab = networks.filter(item => {
		return item.NetworkId = networkId;
	});
	if (tab.length > 0)
		return tab[0];
}



function LoadNetwork() {
	var select = $('#network');

	query = new Object();
	query.filters = [
		NewFilter("UserId", "==", "1"),
	];
	var json = JSON.stringify(query, space = 0);

	$.getJSON("/api/identity?q=" + json, function (data) {
		select.empty();
		identities = data.objects;
		if (identities == null) {
			alert("user 1 not found");
			return;
		}


		$.each(identities, function (idx, ident) {
			networks = ident.Networks;
			$.each(networks, function (index, item) {
				select.append('<option value="' + item.NetworkId + ' "> ' + item.NetworkName + '</option>');
			})
		});
		select.selectpicker('refresh');
	});

	select.change(function () {
		var network = GetNetwork(this.value);

		if (network)
			RefreshBuffers(network);
	});
}


function RefreshBuffers(network) {
	var select = $('#buffer');
	$.getJSON("/api/network/" + network.NetworkId, function (data) {
		select.empty();
		buffers = data.Buffers;
		$.each(buffers, function (idx, item) {
			bufferName = item.BufferName;
			if (bufferName == null || bufferName.trim().length == 0)
				return;
			select.append('<option value="' + item.BufferId + ' "> ' + item.BufferName + '</option>');
		});
		select.selectpicker('refresh');
	});
}

function NewFilter(name, op, val) {
	var filter = Object();
	filter.name = name;
	filter.op = op;
	filter.val = val;
	return filter;
}

function GetSenderName(ident) {
	var tab = ident.split("!");
	if (tab.length > 0)
		return tab[0];
	return ident;
}


function htmlEncode(value) {
	return $('<div/>').text(value).html();
}

function GetDateFormat(row) {
	var d = new Date(0);
	d.setUTCSeconds(row.Time);
	var opts = {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hours: "2-digits",
		minutes: "2-digits",
		seconds: "2-digits",
	};

	var locale = window.navigator.userLanguage || window.navigator.language;
	var date = d.toLocaleTimeString('fr-FR', opts);
	return date;
}

function GetSender(row) {
	var sender = GetSenderName(row.Sender.SenderIdent);

	return sender;
}

function GetDataTable() {
	if (searchResults == null) {
		searchResults = $('#searchResults').DataTable({
			"processing": true,
			"serverside": true,
			"deferLoading": 0, // here
			"ordering": true,
			"sort": true,
			ajax: {
				dataSrc: "objects",
			},
			columns: [{
				"name": "date",
				"title": "Date",
				"orderable": true,
				"width": "220px",
				"render": function (data, type, row) {
					if (type === 'display' || type === 'filter') {
						return GetDateFormat(row);
					}
					return row.Time;
				},
			}, {
				"name": "buffer",
				"title": "Buffer",
				"width": "150px",
				"orderable": true,
				"render": function (data, type, row) {
					return "[" + GetBufferName(row.BufferId) + "]";
				},
			}, {
				"name": "user",
				"title": "User",
				"width": "150px",
				"orderable": true,
				"render": function (data, type, row) {
					return htmlEncode("<" + GetSender(row) + ">");
				},
			}, {
				"name": "message",
				"title": "Message",
				"orderable": true,
				"render": function (data, type, row) {
					return context.HighlightMessage(row.Message);
				}
			}, ],
		});
	}

	return searchResults;
}

function GetBufferName(bufferId) {
	var tab = buffers.filter(function (val) {
		if (val.BufferId == bufferId) {
			return true;
		}
	});

	return tab[0].BufferName;
}

function QueryBacklogDetails(message, op) {
	var query = {
		filters: [
			NewFilter("MessageId", op, message.MessageId),
			NewFilter("BufferId", '==', message.BufferId),
		],
		limit: 50,
		order_by: [{
			"field": "MessageId",
			"direction": op.includes("<") ? "desc" : "asc",
		}],
	}
	var json = JSON.stringify(query, space = 0);
	console.log(json);
	return json;
}


function MeasureAjax(ctx, action, param) {
	var start = new Date().getTime();

	action(function () {
		param();

		var end = new Date().getTime();
		var elapsed = end - start;
		console.log(ctx, ": ", elapsed, "ms");
	});
}

function BuildSearchedWords() {
	var idx = 0;
	searchedWords = Enumerable.From($("#searchText").val().trim().split(" ")).Select(word => {
		var mark = marks[idx];
		idx++;
		return {
			Word: word,
			Mark: "<mark class=\"" + mark + "\">" + word + "</mark>",
		};
	}).ToDictionary(word => word.Word);


}

function BuildSearchQuery(bufferIds) {
	BuildSearchedWords();


	if (bufferIds == null || searchedWords.Count() == 0) {
		alert("invalid request");
		return false;
	}



	query = new Object();
	query.filters = [
		NewFilter("BufferId", "in", bufferIds),
	];

	searchedWords.ToEnumerable().ForEach(kvp =>
		query.filters.push(NewFilter("Message", "ilike", encodeURIComponent("%" + kvp.Value.Word + "%")))
	);

	return query;
}

function HighlightMessageWithSearchedWords(message) {
	var words = searchedWords.ToEnumerable().Select(kvp => kvp.Key).ToArray().join("|");

	var re = new RegExp(words, "gi");

	var msg = message.replace(re, match => {
		return searchedWords.Get(match).Mark;
	});
	return msg;
}


function BuildRegexQuery(bufferIds) {
	regText = $("#searchText").val().trim();

	context.regex = new RegExp(regText, "gi");
	if (context.regex == null)
		throw "invalid regex: " + regText;

	query = new Object();
	query.filters = [
		NewFilter("BufferId", "in", bufferIds),
		NewFilter("Message", "REGEXP", encodeURIComponent(regText)),
	];

	return query;
}

function HighlightMessageWithRegexp(message) {
	var msg = message.replace(context.regex, match => {
		return "<mark class=\"mark0\">" + match + "</mark>";
	});
	return msg;
}

function BuildContext() {
	context = new Object();
	if (IsQueryARegex() == false) {
		context.BuildQuery = BuildSearchQuery;
		context.HighlightMessage = HighlightMessageWithSearchedWords;
	} else if (IsQueryARegex()) {
		context.HighlightMessage = HighlightMessageWithRegexp;
		context.BuildQuery = BuildRegexQuery;
	}
}

function DoSearch() {


	BuildContext();

	var bufferIds = $("#buffer").val();
	var query = context.BuildQuery(bufferIds);
	//console.log("query", query);

	var queryJson = JSON.stringify(query);

	//console.log("queryJson ", queryJson);
	sr = GetDataTable();

	MeasureAjax("backlog query", sr.ajax.url("/api/backlog?q=" + queryJson).load, AttachOnClickToSearchResults)

}


function AttachOnClickToSearchResults() {
	sr = GetDataTable();
	sr.columns.adjust().draw();
	$(document).on('hover', '#searchResults tr', function () {
		$(this).css("cursor", "pointer");
	});


	$('#searchResults tbody').on('click', 'tr', function () {
		var data = sr.row(this).data();

		var target = '/api/backlog?q=' + QueryBacklogDetails(data, "<");
		$.getJSON(target,
			function (beforeDetails) {
				query = QueryBacklogDetails(data, ">=");
				target = '/api/backlog?q=' + query;
				$.getJSON(target,
					function (afterDetails) {
						var details = beforeDetails.objects;
						logContent = details.concat(afterDetails.objects).sort(SortByTime);

						RefreshLogDetails();
					});


			});
	});
}

function SortByTime(left, right) {
	return left.Time - right.Time;

}

function FetchLog(direction) {
	var message;
	if (direction == "<") {
		message = logContent[0];
	} else {
		message = logContent[logContent.length - 1];
	}

	var target = '/api/backlog?q=' + QueryBacklogDetails(message, direction);
	$.getJSON(target, function (data) {
		tab = data.objects;

		if (direction == "<") {
			logContent = tab.sort(SortByTime).concat(logContent);
		} else {
			logContent = logContent.concat(tab.sort(SortByTime));
		}

		RefreshLogDetails();
	})

}

function GetLogDisplay(logDetail) {
	var log = "";
	logDetail.forEach(function (msg) {
		line = GetDateFormat(msg) +
			/* '[' + GetBufferName(msg.BufferId) + ']' + */
			htmlEncode(" <" + GetSenderName(msg.Sender.SenderIdent) + "> ") + context.HighlightMessage(msg.Message) + "\n";
		log += "<li>" + line + "</li>";

	})
	return log;
}

function RefreshLogDetails() {

	var log = GetLogDisplay(logContent);
	logDetails = $("#logDetails");
	logDetails.empty();
	logDetails.append(log);
	$("#logPanel").show();
}

// function Test() {
// 	var crypto = window.crypto || window.msCrypto;
// 	data = "test";
// 	if (crypto.subtle) {
// 		alert("Cryptography API Supported");

// 		var promise = crypto.subtle.digest({
// 			name: "SHA-256"
// 		}, convertStringToArrayBufferView(data));

// 		promise.then(function (result) {
// 			var hash_value = convertArrayBufferToHexaDecimal(result);
// 		});
// 	} else {
// 		alert("Cryptography API not Supported");
// 	}

// }