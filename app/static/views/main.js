var networks; // networks linked to the user
var buffers; // buffers for the selected network 

var searchResults; // datatable with query search results
var searchedWords; // array containing searched words input
var logContent; // JSon log content 

var context = { // query context switcher ( regex vs plain text and so on)
	BuildQuery: null,
	HighlightMessage: null,
	SetupColumns: null,
};

var anchorCount = 1;

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

function IsGlobalSearch() {
	var b = $("#isGlobalSearch").is(":checked");
	return b;
}

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

	query = {
		filters: [
			NewFilter("UserId", "==", user.UserId),
		]
	};


	var json = JSON.stringify(query, space = 0);

	MakeJSonCall("/api/identity?q=" + json, idData => {
		select.empty();
		identities = idData.objects;
		if (identities == null) {
			alert("user 1 not found");
			return;
		}

		var idents = Enumerable.From(identities).Select(i => i.IdentityId).ToArray();
		query = {
			filters: [
				NewFilter("IdentityId", "in", idents)
			]
		};
		json = JSON.stringify(query, space = 0);
		MakeJSonCall("/api/network?q=" + json, networkData => {
			var networksData = networkData.objects;
			networks = Enumerable.From(networksData).ToDictionary(i => i.NetworkId);

			networks.ToEnumerable().Select(kvp => kvp.Value).ForEach(item =>
				select.append('<option value="' + item.NetworkId + ' "> ' + item.NetworkName + '</option>')
			);
			select.selectpicker('refresh');

			select.change(function () {
				var network = networks.Get(+this.value.trim()); // fuck you javascript
				if (network)
					RefreshBuffers(network);
			});
		});

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
		buffers = Enumerable.From(data.objects).ToDictionary(b => b.BufferId);
		var grp = 2;

		buffers.ToEnumerable().Select(kvp => kvp.Value).ForEach(item => {
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
				"name": "network",
				"title": "Network",
				"width": "150px",
				"orderable": true,
				"visible": false,
				"render": (data, type, row) => networks.Get(+row.Buffer.NetworkId).NetworkName,
			}, {
				"name": "buffer",
				"title": "Buffer",
				"width": "150px",
				"orderable": true,
				"render": (data, type, row) =>
					"[" + row.Buffer.BufferName + "]",
			}, {
				"name": "user",
				"title": "User",
				"width": "150px",
				"orderable": true,
				"render": function (data, type, row) {
					if (row.Type == "1")
						return htmlEncode("<" + GetSender(row) + ">");
					return " * " + GetSender(row) + " ";
				},
			}, {
				"name": "message",
				"title": "Message",
				"orderable": true,
				"render": function (data, type, row) {
					return context.HighlightMessage(htmlEncode(row.Message));
				}
			}, ],
		});

		$(document).on('hover', '#searchResults tr', function () {
			$(this).css("cursor", "pointer");
		});
	}
	return searchResults;
}


function QueryBacklogDetails(message, op) {
	var query = {
		filters: [
			NewFilter("MessageId", op, message.MessageId),
			NewFilter("BufferId", '==', message.BufferId),
			NewFilter("Type", 'in', [1, 4]), // only plain messages
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

function GetAllBuffers() {
	var merged = [];
	networks.ToEnumerable()
		.Select(kvp =>
			Enumerable.From(kvp.Value.Buffers)
			.Select(b => b.BufferId)
			.ToArray())
		.ForEach(t => merged = merged.concat(t));

	return merged;
}

function BuildSearchedWords() {
	var idx = 0;
	text = $("#searchText").val().trim();
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
			PreMark: "<mark class=\"" + mark + "\">",
			PostMark: "</mark>",
		};
	}).ToDictionary(word => word.Word);


}

function BuildSearchQuery(bufferIds) {
	BuildSearchedWords();

	if (searchedWords.Count() == 0) {
		throw "no search query";
	}

	if ((bufferIds == null || bufferIds.length == 0) && !IsGlobalSearch()) {
		throw "No buffer selected and query is not global";
	}


	if (IsGlobalSearch()) {
		bufferIds = GetAllBuffers();
	}

	query = new Object();
	query.filters = [
		NewFilter("BufferId", "in", bufferIds)
	];


	searchedWords.ToEnumerable().ForEach(kvp => {
		query.filters.push(NewFilter("Message", "ilike", encodeURIComponent("%" + kvp.Value.Word + "%")))
	});


	return query;
}

function HighlightMessageWithSearchedWords(message) {
	var words = searchedWords.ToEnumerable().Select(kvp => kvp.Key).ToArray().join("|");

	var re = new RegExp(words, "gi");

	if (message == null) {
		console.log("message:", message);
	}
	var msg = message.replace(re, match => {
		var test = searchedWords.Get(match.toLowerCase());
		return test.PreMark + match + test.PostMark;
	});
	return msg;
}


function BuildRegexQuery(bufferIds) {
	regText = $("#searchText").val().trim();

	if (regText.length <= 0)
		throw "Blank regex";

	context.regex = new RegExp(regText, "gi");
	if (context.regex == null)
		throw "Invalid regex: " + regText;

	if ((bufferIds == null || bufferIds.length == 0) && !IsGlobalSearch()) {
		throw "No buffer selected and query is not global";
	}

	if (IsGlobalSearch()) {
		bufferIds = GetAllBuffers();
	}
	query = new Object();
	query.filters = [
		NewFilter("BufferId", "in", bufferIds),
		NewFilter("Message", "REGEXP", encodeURIComponent(regText)),
	];





	query.filters.push();

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
		context.SetupColumns = sr => sr.columns("network:name").visible(false);
	} else if (IsQueryARegex()) {
		context.HighlightMessage = HighlightMessageWithRegexp;
		context.BuildQuery = BuildRegexQuery;
		context.SetupColumns = sr => sr.columns("network:name").visible(false);
	}
	if (IsGlobalSearch()) {
		context.SetupColumns = sr => sr.columns("network:name").visible(true);
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

		query.filters.push(NewFilter("Type", "in", [1, 4]));

		var queryJson = JSON.stringify(query);

		//console.log("queryJson ", queryJson);
		sr = GetDataTable();

		context.SetupColumns(sr);
		sr.columns.adjust().draw();

		MeasureAjax("backlog query", sr.ajax
			.url("/api/backlog?q=" + queryJson)
			.load, AttachOnClickToSearchResults)
	} catch (err) {
		$("#error").show();
		$("#errorMessage").text(err);
	}

}

var attached = false;

function AttachOnClickToSearchResults() {
	sr = GetDataTable();
	$("#searchPanel").show();
	sr.columns.adjust().draw();

	if (attached == false) {
		$('#searchResults tbody').on('click', 'tr', function () {
			var data = sr.row(this).data();
			ViewLogDetails(data);
		});
		attached = true;
	}

}

function ViewLogDetails(data) {

	var target = '/api/backlog?q=' + QueryBacklogDetails(data, "<");
	MakeJSonCall(target, beforeDetails => {

		query = QueryBacklogDetails(data, ">=");
		target = '/api/backlog?q=' + query;
		MakeJSonCall(target, afterDetails => {
			var details = beforeDetails.objects;
			logContent = details.concat(afterDetails.objects).sort(SortByTime);

			RefreshLogDetails(data);
		})
	});
};

function SortByTime(left, right) {
	return left.Time - right.Time;

}

function FetchLog(direction) {
	var message;
	anchor = null;
	if (direction == "<") {
		message = logContent[0];
	} else {
		message = logContent[logContent.length - 1];
	}

	var target = '/api/backlog?q=' + QueryBacklogDetails(message, direction);
	MakeJSonCall(target, data => {
		tab = data.objects;

		if (direction == "<") {
			anchor = data.objects[data.objects.length - 1];

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

		RefreshLogDetails(anchor);

	})

}

function GetLogDisplay(detail, anchor) {
	var log = "";
	detail.forEach(function (msg) {

		message = msg.Message == null ? "" : msg.Message;
		if (msg.Type == "1") {
			line = GetDateFormat(msg) +
				htmlEncode(" <" + GetSenderName(msg.Sender.SenderIdent) + "> ") + context.HighlightMessage(htmlEncode(message)) + "\n";

		}
		if (msg.Type == "4") {
			line = GetDateFormat(msg) +
				" * " + GetSenderName(msg.Sender.SenderIdent) + " " + context.HighlightMessage(htmlEncode(message)) + "\n";

		}
		if (anchor != null && msg.MessageId == anchor.MessageId) {
			++anchorCount;
			tgt = "logTarget" + anchorCount;
			log += "<li " + (anchor != null && msg.MessageId == anchor.MessageId ? "id=\"" + tgt + "\"" : "") + ">" + line + "</li>";
		} else {

			log += "<li>" + line + "</li>";
		}

	})
	return log;
}

function RefreshLogDetails(anchor) {
	var log = GetLogDisplay(logContent, anchor);
	logDetails = $("#logDetails");
	logDetails.empty();
	logDetails.append(log);
	$("#logPanel").show();

	if (anchor != null) {
		$("html,body").animate({
			scrollTop: $('#logTarget' + anchorCount).position().top - ($(window).height()) / 2
		}, 'slow');
	}
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