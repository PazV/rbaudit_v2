//Funcion que obtiene datos de un formulario y los regresa en forma de diccionario, se envía id del formulario y en caso de contener select, una lista con diccionarios: {id,name}
function getForm(formId,select_list=null,check_list=null){
    //var formId='#'+formId;
    var frm = $(formId).serializeArray().reduce(function(obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    if (select_list!==null){
        for (x in select_list){
            frm[select_list[x]['name']]=parseInt($(select_list[x]['id']).find("option:selected").attr("name"));
        }
    }
    if (check_list!==null){
        var all_checks= $(formId).find("input[type=checkbox]");
        for (a in all_checks){
            if (all_checks[a].type=='checkbox'){
                frm[all_checks[a].name]=all_checks[a].checked;
            }
        }
    }
    return frm;
};

//Cerrar modal
$(".close-modal").click(function(){
    var mod_id=this.offsetParent.offsetParent.offsetParent.id;
    $("#"+mod_id).modal("hide");


});

function emptyField(fieldId,errorId){
    var valid=false;
    var input=$(fieldId);
    var is_name=input.val();
    if(is_name && (input[0].value.trim()).length>0){ //valida si es diferente de vacio y verifica que no tenga puros espacios vacios
        input.removeClass("invalid-field").addClass("valid-field");
        $(errorId).removeClass("show-error-msg").addClass("hide-error-msg");
        valid=true;
    }
    else{
        input.removeClass("valid-field").addClass("invalid-field");
        $(errorId).removeClass("hide-error-msg").addClass("show-error-msg");
        $(errorId).html("Este campo es requerido.");
    }
    return valid;
}

function ajaxError(xhr, textStatus, error){
    $.confirm({
        theme:'dark',
        title:'Atención',
        content:'Su sesión ha expirado, favor de iniciar sesión nuevamente.',
        buttons: {
            confirm:{
                text:'Aceptar',
                action: function(){
                    location.reload();
                }
            }
        }
    });
}

function validateMail(inputId,errorDiv){
    var valid=false;
    var val=$(inputId)[0].value;
    var patt=/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (patt.exec(val)==null){
        $(inputId).removeClass("valid-field").addClass("invalid-field");
        $(errorDiv).removeClass("hide-error-msg").addClass("show-error-msg");
        $(errorDiv).html("Debe ingresar una dirección de correo válida.");
    }
    else{
        $(inputId).removeClass("invalid-field").addClass("valid-field");
        $(errorDiv).removeClass("show-error-msg").addClass("hide-error-msg");
        valid=true;
    }
    return valid;
}

function hasExtension(inputID, exts) {
    var fileName = document.getElementById(inputID).value;
    return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test(fileName);
}

function resetForm(formId,input_type){
    $(formId)[0].reset();
    for (x in input_type){
        var node_name=input_type[x].split("|")[1];
        var input_list=$(formId).find(input_type[x].split("|")[0]);
        for (i in input_list){
            if (input_list[i].nodeName==node_name){ //solo se toman en cuenta los input
                if ($("#"+input_list[i].id).hasClass('valid-field')){
                    $("#"+input_list[i].id).removeClass('valid-field');
                }
                if ($("#"+input_list[i].id).hasClass('invalid-field')){
                    $("#"+input_list[i].id).removeClass('invalid-field');
                }
                if ($("#err"+input_list[i].id).hasClass('show-error-msg')){
                    $("#err"+input_list[i].id).removeClass("show-error-msg").addClass("hide-error-msg");
                }
                // if ($("#err"+input_list[i].id).hasClass('show-error-msg-row')){
                //     $("#err"+input_list[i].id).removeClass("show-error-msg-row").addClass("error-msg-row");
                //     $("#err"+input_list[i].id).html("Error");
                // }

                if (node_name=='SELECT'){
                    $("#"+input_list[i].id).empty(); //vacia un select
                }
            }
        }
    }
}



//función para validar formularios
// function validateForm(formId){
//     var valid = false;
//
// }
