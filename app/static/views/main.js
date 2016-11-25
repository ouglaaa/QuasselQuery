var networks; // networks linked to the user
var buffers; // buffers for the selected network 

var searchResults; // datatable with query search results
var searchedWords; // array containing searched words input
var logContent; // JSon log content 

var context = { // query context switcher ( regex vs plain text and so on)
	BuildQuery: null,
	HighlightMessage: null,
};


var author = user.Token; // apiToken imported from page

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
	$("#viewLog").click(function () {
		ViewLog();
	});
	$('.close').click(function () {
		$('.alert').hide();
	})
	marks = ["mark0", "mark1", "mark2", "mark3", "mark4"];
});

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

function MakeJSonCall(url, success) {
	$.ajax({
		url: url,
		type: "json",
		method: "GET",
		headers: {
			"HTTP_Token": author,
		},
		success: data => success(data)
	});

}


function LoadNetwork() {
	var select = $('#network');

	query = new Object();
	query.filters = [
		NewFilter("UserId", "==", user.UserId),
	];
	var json = JSON.stringify(query, space = 0);

	MakeJSonCall("/api/identity?q=" + json, function (data) {
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

	var query = {
		filters: [
			NewFilter("BufferType", "!=", "1"),
			NewFilter("NetworkId", "==", network.NetworkId),
		],
		limit: 50,
		order_by: [{
			"field": "BufferType",
			"direction": "asc",
		}, {
			"field": "BufferCName",
			"direction": "asc",
		}],
	}

	MakeJSonCall("/api/buffer?q=" + JSON.stringify(query), data => {
		select.empty();
		buffers = data.objects;
		var grp = 2;
		$.each(buffers, function (idx, item) {
			if (item.BufferType != grp) {
				select.append("<option disabled>-----------</option>");
				grp = item.BufferType;
			}
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
				beforeSend: req => req.setRequestHeader("HTTP_Token", author),
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
	//console.log(json);
	return json;
}


function MeasureAjax(ctx, action, param) {
	var start = new Date().getTime();

	action(function () {
		param();

		var end = new Date().getTime();
		var elapsed = end - start;
		//console.log(ctx, ": ", elapsed, "ms");
	});
}

function BuildSearchedWords() {
	var idx = 0;
	text =  $("#searchText").val().trim();
	if (text.length <= 0)
		throw "No search query";
	tab = text.split(" ");
	if (tab.length <= 0)
		throw "No search query";
	searchedWords = Enumerable.From(tab).Select(word => {
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


	console.log(searchedWords);
	if (searchedWords.Count() == 0) {
		throw "no search query";
	}
	if (bufferIds == null) {
		throw "No buffer selected and query is not global";
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
	$("#error").hide();
	$("#logPrev").show();
	$("#logNext").show();
	$("#logPanel").hide();

	BuildContext();

	var bufferIds = $("#buffer").val();
	try {
		var query = context.BuildQuery(bufferIds);



		//console.log("query", query);

		var queryJson = JSON.stringify(query);

		//console.log("queryJson ", queryJson);
		sr = GetDataTable();

		MeasureAjax("backlog query", sr.ajax
			.url("/api/backlog?q=" + queryJson)
			.load, AttachOnClickToSearchResults)
	} catch (err) {
		$("#error").show();
		$("#errorMessage").text(err);
	}

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
		MakeJSonCall(target, beforeDetails => {

			query = QueryBacklogDetails(data, ">=");
			target = '/api/backlog?q=' + query;
			MakeJSonCall(target, afterDetails => {
				var details = beforeDetails.objects;
				logContent = details.concat(afterDetails.objects).sort(SortByTime);

				RefreshLogDetails();
			})
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
	MakeJSonCall(target, data => {
		tab = data.objects;

		if (direction == "<") {
			if (tab.length == 0)
				$("#logPrev").hide();
			else
				logContent = tab.sort(SortByTime).concat(logContent);

		} else {
			if (tab.length == 0)
				$("#logNext").hide();
			else
				logContent = logContent.concat(tab.sort(SortByTime));
		}

		RefreshLogDetails();

	})

}

function GetLogDisplay(detail) {
	var log = "";
	detail.forEach(function (msg) {
		line = GetDateFormat(msg) +
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

function ViewLog() {
	$("#searchPanel").hide();
	$("#error").hide();
	var bufferIds = $("#buffer").val();
	$("#logPrev").show();
	if (bufferIds == null || bufferIds.length == 0)
		return;
	var bufferId = bufferIds[0];

	context = {
		HighlightMessage: msg => msg,
	};

	var query = {
		filters: [
			NewFilter("BufferId", "==", bufferId)
		],
		order_by: [{
			"field": "MessageId",
			"direction": "desc",

		}],
		limit: 150
	};
	queryJson = JSON.stringify(query);
	MakeJSonCall("/api/backlog?q=" + queryJson, data => {
		logContent = data.objects.sort(SortByTime);

		RefreshLogDetails();

		$("#logNext").hide();
	});


}