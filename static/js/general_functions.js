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
        var all_checks=$(formId).find("input[type=checkbox]");
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
    $(".close-modal").parents('.modal').modal('hide');
});
