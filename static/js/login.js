$.(document).ready(function(){

    $("#btnSignin").click(function(){
        var validEmail=validateLoginMail();
        if (validEmail===true){
            var validPass=emptyPass();
            if (validPass===true){
                console.log("datos válidos");
            }
            else{
                console.log("no válido");
            }
        }
        else{
            console.log("no válido");
        }
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
