$(document).ready(function() {

    if ($('#serverList').length) {
        populateServerListTable();
    }

    if ($('#logEntry').length) {
        populateLogEntry();
    }

    function populateServerListTable() {
        // Empty content string
        var tableContent = '';

        // jQuery AJAX call for servers JSON
        $.getJSON( '/getServers', function( data ) {

            // For each item in our JSON, add a table row and cells to the content string
            $.each(data, function(){

                var statuses = '';

                if (this.files) {
                    statuses += '<span class="status files">Files</span>'
                }

                if (this.database) {
                    statuses += '<span class="status database">Database</span>'
                }

                tableContent += '<tr id="server_' + this._id + '">';
                tableContent += '<td>' + this._id + '</td>';
                tableContent += '<td>' + this.name +'</td>';
                tableContent += '<td class="statuses">' + statuses + '</td>';
                tableContent += '</tr>';
            });

            // Inject the whole content string into our existing HTML table
            $('#serverList tbody').html(tableContent);

            // jQuery AJAX call log entries JSON
            $.getJSON( '/getEntries', function( data ) {

                // For each item in our JSON, find the server in the table and populate the data
                $.each(data, function() {
                    var statusSpan = $('tr#server_' + this.serverId + ' td.statuses span.' + this.type);
                    statusSpan.addClass(this.success ? 'success' : 'fail');
                    statusSpan.contents().wrap('<a/>');
                    statusSpan.find('a').attr('href', '/showLog?id=' + this._id);
                });
            });
        });
    }

    function populateLogEntry() {
        // jQuery AJAX call for log entry JSON
        var urlParams = getUrlVars();
        $.getJSON( '/getLog?id=' + urlParams['id'], function( data ) {
            // For each item in our JSON, add a table row and cells to the content string
            $('#status').text($('#status').text() + " " + (data.success ? "Success" : "Fail"));
            $('#server').text($('#server').text() + " " + data.serverName + " " + data.date);
            $('#type').text($('#type').text() + " " + data.type);
            $('#logEntry').text(data.log);
        });

    }

    // Read a page's GET URL variables and return them as an associative array.
    function getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
});