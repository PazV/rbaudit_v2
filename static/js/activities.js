$(document).ready( function () {

    var date = new Date();
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
    $("#activ_date").val(lastDay);

    $('#tableActList').DataTable({
        searching: false,
        ordering:  false,
        lengthChange:false
    });
});
