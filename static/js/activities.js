$(document).ready( function () {
    $('#table_id').DataTable();
    $('#table_id').DataTable({
        searching: false,
        ordering:  false,
        lengthChange:false
    });
} );
