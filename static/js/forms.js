$(document).ready(function(){
    var me = this;
    $("#btnGotoFormStep2").click(function(){
        window.location.pathname='/project/createform/2';
    });

    $("#btnAddOption").click(function(){
        $("#divListOptions").append('<div class="form-group row added-option"><label class="col-sm-3 col-form-label col-form-label-sm" >Opción 2: </label><div class="col-sm-7"><input type="text" class="form-control form-control-sm" placeholder="Opción 2"/></div></div>');
    });

    $("#btnRemoveOption").click(function(){
        $(".added-option:last-child").remove();
    });
});
