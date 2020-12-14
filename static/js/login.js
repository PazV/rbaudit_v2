$(document).ready(function(){

    // $("#btnSignin").click(function(){
    //     var validEmail=validateLoginMail();
    //     if (validEmail===true){
    //         var validPass=emptyPass();
    //         if (validPass===true){
    //             console.log("datos válidos");
    //         }
    //         else{
    //             console.log("no válido");
    //         }
    //     }
    //     else{
    //         console.log("no válido");
    //     }
    // });

    $(".close-modal").click(function(){
        var mod_id=this.offsetParent.offsetParent.offsetParent.id;
        $("#"+mod_id).modal("hide");
    });

    $("#btnRecoverPassword").click(function(){
        window.location.pathname='/recover-password'
        // var value=$("#FPemail").val();
        // if (value && $("#FPemail")[0].value.trim().length>0){
        //     var patt=/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        //     if (patt.exec($("#FPemail")[0].value)!=null){
        //         $("#btnRecoverPassword").prop("disabled",true);
        //         $.ajax({
        //             url:'/login/recoverPassword',
        //             type:'POST',
        //             data:JSON.stringify({'email':$("#FPemail").val()}),
        //             success:function(response){
        //                 try{
        //                     var res=JSON.parse(response);
        //                 }catch(err){
        //                     ajaxError();
        //                 }
        //                 $.alert({
        //                     theme:'dark',
        //                     title:'Atención',
        //                     content:res.msg_response
        //                 });
        //                 if (res.success){
        //                     $("#mod_forgot_password").modal("hide");
        //                 }
        //             },
        //             error:function(){
        //                 $.alert({
        //                     theme:'dark',
        //                     title:'Atención',
        //                     content:'Ocurrió un error, favor de intentarlo de nuevo.'
        //                 });
        //             }
        //         });
        //     }
        //     else{
        //         $.alert({
        //             theme:'dark',
        //             title:'Atención',
        //             content:'El formato es incorrecto, favor de ingresar una dirección de correo válida.'
        //         });
        //     }
        // }
        // else{
        //     $.alert({
        //         theme:'dark',
        //         title:'Atención',
        //         content:'Este campo no puede ir vacío.'
        //     });
        // }
    });

    $("#mod_forgot_password").on('hide.bs.modal',function(){
        $("#FPemail").val("");
        $("#btnRecoverPassword").prop("disabled",false);
    });

});

function validateLoginMail(){
    var valid=false;
    var val=$("#loginEmail")[0].value;
    var patt=/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (patt.exec(val)==null){
        $("#errorLoginEmail").removeClass("hide-login-error").addClass("show-login-error");
    }
    else{
        $("#errorLoginEmail").removeClass("show-login-error").addClass("hide-login-error");
        valid=true;
    }
    return valid;
}

function emptyPass(){
    var valid=false;
    var input=$("#loginPassword");
    var is_name=input.val();
    if(is_name && (input[0].value.trim()).length>0){ //valida si es diferente de vacio y verifica que no tenga puros espacios vacios
        $("#errorLoginPassword").removeClass("show-login-error").addClass("hide-login-error");
        valid=true;
    }
    else{
        $("#errorLoginPassword").removeClass("hide-login-error").addClass("show-login-error");
        $(errorId).html("Este campo es requerido.");
    }
    return valid;
}
