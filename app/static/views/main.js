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

function GetNetwork(networkId) {
	var tab = networks.filter(item => {
		return item.NetworkId = networkId;
	});
	if (tab.length > 0)
		return tab[0];
}



function LoadNetwork() {
	var select = $('#network');

	$.getJSON("/api/identity/1", function (data) {
		select.empty();
		networks = data.Networks;

		$.each(networks, function (index, item) {
			select.append('<option value="' + item.NetworkId + ' "> ' + item.NetworkName + '</option>');
		})
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
	return "[" + date + "]";
}

function GetSender(row) {
	var sender = GetSenderName(row.Sender.SenderIdent);

	return htmlEncode("<" + sender + ">");

}

function GetDataTable() {
	if (searchResults == null) {
		searchResults = $('#searchResults').DataTable({
			"processing": true,
			"serverside": true,
			"deferLoading": 0, // here
			ajax: {
				dataSrc: "objects",
			},
			columns: [{
				"data": function (row, type, val, meta) {
					return GetDateFormat(row);
				},
			}, {
				"data": function (row, type, val, meta) {
					return "[" + GetBufferName(row.BufferId) + "]";
				},
			}, {
				"data": function (row, type, val, meta) {
					return GetSender(row);
				},
			}, {
				"data": "Message",
			}, ],
		});
	}

	return searchResults;
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

							log += GetDateFormat(msg) +
									/* '[' + GetBufferName(msg.BufferId) + ']' + */
									" <" + GetSenderName(msg.Sender.SenderIdent) + "> " + msg.Message + "\n";

						})
						$("#logDetails").val(log);
					});


			});
	});
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
	var searchText = $("#searchText").val().trim();

	var bufferIds = $("#buffer").val();

	var bufferId = bufferIds[0];

	if (bufferIds == null || searchText.length == 0) {
		alert("invalid request");
		return false;
	}

	searchText = "%" + searchText + "%";
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