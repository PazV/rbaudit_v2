$(document).ready(function(){
    var me = this;

    $("#btnChangePassword").click(function(){
        $("#password_collapse").toggle(300);
    });

    $("#NUuser_image").change(function(){
        var path=$("#NUuser_image")[0].value.split("\\").pop();
        $("#NUuser_image").siblings("label").html(path);
    });

    $("#mod_new_user").on('hidden.bs.modal',function(){
        $("#NUuser_image").siblings("label").html("Seleccionar imagen");
    });

    $("#MAuser_image").change(function(){
        var path=$("#MAuser_image")[0].value.split("\\").pop();
        $("#MAuser_image").siblings("label").html(path);
    });

    $("#mod_my_account").on('hidden.bs.modal',function(){
        $("#MAuser_image").siblings("label").html("Seleccionar imagen");
    });

    $("#btnSaveUser").click(function(){
        console.log(getForm('#frmNewUser',null,true));
    });

});
