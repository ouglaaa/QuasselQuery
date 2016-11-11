$(document).ready(function () {
	LoadNetwork();

	$("#go").click(function () {
		DoSearch();
	});

	$('#searchText').keydown(function (event) {
		if (event.keyCode == 13 || event.which == 13) {
			DoSearch();
		}
	});

});
var networks;
var buffers;

var searchResults;
var searchedText;

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
			ajax: {
				dataSrc: "objects",
			},
			columns: [{
				"name": "date",
				"title": "date",
				"orderable": true,
				"render": function (data, type, row) {
					return GetDateFormat(row);
				},
			}, {
				"name": "buffer",
				"title": "buffer",
				"orderable": true,
				"render": function (data, type, row) {
					return "[" + GetBufferName(row.BufferId) + "]";
				},
			}, {
				"name": "user",
				"title": "user",
				"orderable": true,
				"render": function (data, type, row) {
					return htmlEncode("<" + GetSender(row) + ">");
				},
			}, {
				"name": "message",
				"title": "message",
				"orderable": true,
				"render": function (data, type, row) {
					return GetMessage(row.Message);
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


function DoSearch() {
	searchedText = $("#searchText").val().trim();

	var bufferIds = $("#buffer").val();

	var bufferId = bufferIds[0];

	if (bufferIds == null || searchedText.length == 0) {
		alert("invalid request");
		return false;
	}

	var searchText = "%" + searchedText + "%";
	query = new Object();
	query.filters = [
		NewFilter("BufferId", "in", bufferIds),
		NewFilter("Message", "ilike", encodeURIComponent(searchText)),
	];

	var queryJson = JSON.stringify(query);

	sr = GetDataTable();
	sr.ajax.url("/api/backlog?q=" + queryJson).load(function () {
		AttachOnClickToSearchResults();
	});


}


function AttachOnClickToSearchResults() {
	sr = GetDataTable();
	sr.columns.adjust().draw();
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
						details = details.concat(afterDetails.objects).sort(function (left, right) {
							return left.Time - right.Time;
						});

						var log = "";
						details.forEach(function (msg) {
							line = GetDateFormat(msg) +
								/* '[' + GetBufferName(msg.BufferId) + ']' + */
								" <" + GetSenderName(msg.Sender.SenderIdent) + "> " + msg.Message + "\n";
							log += "<li>" + htmlEncode(GetMessage(line)) + "</li>";

						})
						logDetails = $("#logDetails");
						logDetails.empty();
						logDetails.append(log);
					});


			});
	});
}

function GetMessage(message) {
	var txt = searchedText;
	var target = "<mark>" + txt + "</mark>";
	var regex = new RegExp(txt, "ig")
	var msg = message.replace(regex, target);
	return msg;
}