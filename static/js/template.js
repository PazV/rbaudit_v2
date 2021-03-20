$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    loadTemplatesTable();

    if (window.location.pathname=='/templates/preview/'+me.user_info['template_factor']+'/'+me.user_info['t_form_id']){
        loadTempFormPreview(me.user_info['t_form_id'],1);
    }


    $("#btnAddNewTemplate").click(function(){
        if ($("#newTemplateName").val().trim()!=''){
            $.ajax({
                url:'/templates/saveNewTemplate',
                type:'POST',
                data:JSON.stringify({'name':$("#newTemplateName").val().trim()}),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response
                    });
                    if (res.success){
                        $("#newTemplateName").val('');
                        loadTemplatesTable();
                    }
                },
                failure:function(){
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                    });
                }
            });
        }
    });

    $("#tableTemplates").on('click','.template-newform-a',function(e){
        console.log("click");
        console.log(e);
        $($(e)[0].currentTarget).parent('div').data('templateid');
        $("#aHomeMPModTempForm").data('templateid',$($(e)[0].currentTarget).parent('div').data('templateid'));
        getFirstTempMenuFolders($($(e)[0].currentTarget).parent('div').data('templateid'));
    });

    $("#tableTemplates").on('click','.template-edit-a',function(e){
        $("#mod_edit_template").data('template_id',$($(e)[0].currentTarget).parent('div').data('templateid'));
        $.ajax({
            url:'/templates/getTemplateEditInfo',
            type:'POST',
            data:JSON.stringify({'template_id':$($(e)[0].currentTarget).parent('div').data('templateid')}),
            success:function(response){

                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }

                if (res.success){
                    $("#edTempName").val(res.data.name);
                    $("#edTempEnabled option[value="+res.data.enabled+"]").attr('selected','selected')
                    for (var x of res.data.workspaces){
                        if (x['checked']=="true"){
                            checked='checked'
                        }
                        else{
                            checked=''
                        }
                        $("#frmTemplateWS").append('<div class="custom-control custom-checkbox"><input class="custom-control-input" type="checkbox" id="ws_'+x['workspace_id']+'" name="ws_'+x['workspace_id']+'" '+checked+'/><label class="custom-control-label" for="ws_'+x['workspace_id']+'">'+x['workspace_name']+'</label></div>')
                    }
                }
            }
        });
    });
    $("#mod_edit_template").on('hidden.bs.modal',function(){
        $("#frmTemplateWS").empty();
        $("#edTempEnabled option[value=false]").removeAttr("selected");
        $("#edTempEnabled option[value=true]").removeAttr("selected");
    });

    $("#btnAddTempFolder").click(function(){
        $("#mod_add_temp_folder").modal("show");
        $("#mod_add_temp_folder").data('mode','new');

        $("#divTempFIparent").css('display','flex');
        $("#mod_add_temp_folder").find('.spn-modal-header').html('Crear carpeta');
        if ($("#div-include-fmp-mod-temp-form").children().length==0){
            $("#TempFIparent").val('Raíz');
            $("#mod_add_temp_folder").data('parent_id',-1);
        }
        else{
            //es de una subcarpeta
            //obtener última subcarpeta para asignarla como parent_id
            $("#TempFIparent").val($("#div-include-fmp-mod-temp-form").children('.div-return-menu-subfolder').last()[0].outerText);
        }

    });

    $("#btnEditTempFolder").click(function(){
        $("#mod_add_temp_folder").modal("show");
        $("#mod_add_temp_folder").data('mode','edit');
        $("#mod_add_temp_folder").data('t_folder_id','');
    });

    $("#mod_add_temp_folder").on('shown.bs.modal',function(){
        $("#TempFIname").focus();
    });

    $("#mod_create_form_for_template").on('hidden.bs.modal',function(){
        // $("#newFormImportProjectName").html('');
        $("#divMPFoldersContModTemp").empty();
        $("#div-include-fmp-mod-temp-form").empty();

        resetForm("#frmCreateTemplateForm",['input|INPUT']);
    })

    $("#btnSaveTempFolder").click(function(){
        var valid=emptyField('#TempFIname','#errTempFIname');

        if (valid){
            var data={};
            data['name']=encodeURIComponent($("#TempFIname").val());
            data['mode']=$("#mod_add_temp_folder").data('mode');
            data['template_id']=$("#aHomeMPModTempForm").data('templateid');
            if ($("#div-include-fmp-mod-temp-form").children().length==0){
                data['parent_id']=-1;
            }
            else{
                // $("#div-include-fmp").children('.div-return-menu-subfolder').last()

                data['parent_id']=$("#div-include-fmp-mod-temp-form").children('.div-return-menu-subfolder').last().find('a').data('folder');
            }
            if (data['mode']=='new'){


                // data['parent_id']=$("#mod_add_folder").data('parent_id');
                // data['project_id']=me.user_info['project_id'];
            }
            else{
                data['t_folder_id']=$("#mod_add_temp_folder").data('t_folder_id');

            }
            console.log(data['parent_id']);
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/templates/saveTempFolder',
                type:'POST',
                data:JSON.stringify(data),
                success:function(response){
                    EasyLoading.hide();
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response
                    });
                    if (res.success){
                        $("#mod_add_temp_folder").modal("hide");
                        if (data['parent_id']==-1){
                            getFirstTempMenuFolders(data['template_id']);
                        }
                        else{
                            getTempSubfoldersForms(data['parent_id'],data['template_id']);
                        }
                    }
                },
                error:function(){
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                    });
                }
            });
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe asignar un nombre a la carpeta.'
            });
        }
    });

    $("#aHomeMPModTempForm").click(function(){
        $("#div-include-fmp-mod-temp-form").empty();
        getFirstTempMenuFolders($("#aHomeMPModTempForm").data('templateid'));
    });

    $("#btnSaveCreateTempForm").click(function(){
        $("#frmCreateTemplateForm .form-control,.custom-file-input").focusout();
        var valid=false;
        var form_input=$("#frmCreateTemplateForm :input");
        var valid=true;
        for (var x in form_input){
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
                break
            }
        }
        if (valid===true){
            var data = new FormData();
            data.append('user_id',me.user_info['user_id']);
            data.append('template_id',$("#aHomeMPModTempForm").data('templateid'));
            data.append('form_id',-1);
            data.append('t_folder_id',$("#newTempFormFolder").data('folderid'));
            data.append('name',$("#newTempFormName").val());
            var file = $("#newTempFormFile")[0].files[0];
            var file_name=$("#newTempFormFile")[0].files[0].name;
            data.append(file_name,file);
            data.append('file_name',file_name);
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/templates/saveTempForm',
                type:'POST',
                processData:false,
                contentType:false,
                data:data,
                success:function(response){
                    EasyLoading.hide();
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:'El formulario ha sido creado, será abierto en una nueva pestaña.',
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        loadTemplatesTable();
                                        window.open('/templates/preview/'+res.template_factor+'/'+res.t_form_id,'_blank');

                                        $("#mod_create_form_for_template").modal('hide');
                                    }
                                }
                            }
                        });
                    }
                    else{
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                    }
                },
                error:function(){
                    EasyLoading.hide();
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                    });
                }
            });
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Existen campos incorrectos o vacíos, favor de revisar.'
            });
        }
    });

    $("#btnSaveEditedTemp").click(function(){
        var frm = getForm('#frmEditTemplate',null,true);

        EasyLoading.show({
            text:'Cargando...',
            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
        });
        frm['template_id']=$("#mod_edit_template").data('template_id');
        $.ajax({
            url:'/templates/saveEditedTemp',
            type:'POST',
            data:JSON.stringify(frm),
            success:function(response){
                EasyLoading.hide();
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:res.msg_response
                });
                if (res.success){
                    loadTemplatesTable();
                    $("#mod_edit_template").modal("hide");
                }
            },
            error:function(){
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Ocurrió un error, favor de intentarlo de nuevo más tarde.'
                });
            }
        });
    });

    $("#tableTemplates").on('click','.template-delete-a',function(e){
        $.alert({
            theme:'dark',
            title:'Atención',
            content:'¿Está seguro que quiere eliminar esta plantilla?',
            buttons:{
                confirm:{
                    text:'Sí',
                    action:function(){
                        EasyLoading.show({
                            text:'Cargando...',
                            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                        });
                        $.ajax({
                            url:'/templates/deleteTemplate',
                            type:'POST',
                            data:JSON.stringify({'template_id':$($(e)[0].currentTarget).parent('div').data('templateid')}),
                            success:function(response){
                                EasyLoading.hide();
                                try{
                                    var res=JSON.parse(response);
                                }catch(err){
                                    ajaxError();
                                }
                                $.alert({
                                    theme:'dark',
                                    title:'Atención',
                                    content:res.msg_response
                                });
                                if (res.success){
                                    loadTemplatesTable();
                                }
                            },
                            error:function(){
                                $.alert({
                                    theme:'dark',
                                    title:'Atención',
                                    content:'Ocurrió un error, favor de intentarlo de nuevo más tarde.'
                                });
                            }
                        });
                    }
                },
                cancel:{
                    text:'No'
                }
            }
        });
    });





});

function loadTemplatesTable(){
    $("#tableTemplates").DataTable({
        "scrollY":"250px",
        "scrollCollapse":true,
        "lengthChange":false,
        serverSide:true,
        destroy:true,
        searching:false,
        ordering:false,
        ajax:{
            data:{},
            url:'/templates/getTemplatesTable',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'name',"width":"40%", "className":"dt-head-center dt-body-left"},
            {data:'forms_total',"width":"10%", "className":"dt-head-center dt-body-center"},
            {data:'last_updated',"width":"20%", "className":"dt-head-center dt-body-center"},
            {data:'enabled_name',"width":"20%", "className":"dt-head-center dt-body-center"},
            {data:'actions',"width":"10%", "className":"dt-head-center dt-body-center"},
        ]

    });

}

function getFirstTempMenuFolders(template_id){
    $.ajax({
        url:'/templates/getFirstTempMenuFolders',
        type:'POST',
        data:JSON.stringify({'template_id':template_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divMPFoldersContModTemp").empty();
                $("#divMPFoldersContModTemp").append(res.data);
                $(".folder-icon-div").dblclick(function(){
                    //incluir carpeta en path superior

                    $("#div-include-fmp-mod-temp-form").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a><div>');
                    $("#div-include-fmp-mod-temp-form").addClass('row');
                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder").click(function(){
                        returnTempSubFolder($(this).data('folder'),template_id);
                        console.log($(this));
                        $(this).parent('.div-return-menu-subfolder').remove();
                    });
                    //obtener subcarpetas
                    getTempSubfoldersForms($($(this).children(".checkbox-folder-menu")).data('document'),template_id);

                    $("#newTempFormFolder").val($(this).find('.mp-a-folder')[0].title);
                    $("#newTempFormFolder").data('folderid',$($(this).children(".checkbox-folder-menu")).data('document'));
                });

            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:res.msg_response
                });
            }
        },
        failure:function(){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un error, favor de intentarlo de nuevo.'
            });
        }
    })
}

function getTempSubfoldersForms(t_folder_id,template_id){
    $.ajax({
        url:'/templates/getTempSubfoldersForms',
        type:'POST',
        data:JSON.stringify({'t_folder_id':t_folder_id,'template_id':template_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divMPFoldersContModTemp").empty();
                $("#divMPFoldersContModTemp").append(res.data);
                $(".folder-icon-div").dblclick(function(){

                    console.log(this);

                    $("#div-include-fmp-mod-temp-form").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a></div>');
                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder").click(function(){
                        returnTempSubFolder($(this).data('folder'),template_id);

                        // $(this).remove();
                        $(this).parent('.div-return-menu-subfolder') .remove();
                    });

                    getTempSubfoldersForms($($(this).children(".checkbox-folder-menu")).data('document'),template_id);

                    $("#newTempFormFolder").val($(this).find('.mp-a-folder')[0].title);
                    $("#newTempFormFolder").data('folderid',$($(this).children(".checkbox-folder-menu")).data('document'));
                });
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:res.msg_response
                });
            }
        },
        failure:function(){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un error, favor de intentarlo de nuevo.'
            });
        }
    })
}

function returnTempSubFolder(parent_id,template_id){
    $.ajax({
        url:'/templates/returnTempSubFolder',
        type:'POST',
        data:JSON.stringify({'parent_id':parent_id,'template_id':template_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divMPFoldersContModTemp").empty();
                $("#divMPFoldersContModTemp").append(res.data);
                $(".folder-icon-div").dblclick(function(){
                    console.log($($(this).children(".checkbox-folder-menu")).data('document'));

                    $("#div-include-fmp-mod-temp-form").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a></div>');
                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder").click(function(){
                        returnTempSubFolder($(this).data('folder'),template_id);
                        // $(this).remove();
                        $(this).parent('.div-return-menu-subfolder') .remove();
                    });

                    getTempSubfoldersForms($($(this).children(".checkbox-folder-menu")).data('document'),template_id);

                    $("#newTempFormFolder").val($(this).find('.mp-a-folder')[0].title);
                    $("#newTempFormFolder").data('folderid',$($(this).children(".checkbox-folder-menu")).data('document'));
                });
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:res.msg_response
                });
            }
        },
        failure:function(){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un error, favor de intentarlo de nuevo.'
            });
        }
    })
}

function loadTempFormPreview(t_form_id,page){
    var me = this;
    $.ajax({
        url:'/templates/showTempFormTable',
        type:'POST',
        data:JSON.stringify({'t_form_id':t_form_id,'page':page}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#columnTempSettingsFormName").html(res.form_name);
                $("#divTempColumnsSettings").append(res.html);
                $("#divTempFormPagingToolbar").append(res.paging_toolbar);
                $("#temp_paging_toolbar_number").val(page);
                $(".form-paging-toolbar").click(function(){
                    $("#divTempColumnsSettings").empty();
                    $("#divTempFormPagingToolbar").empty();
                    loadTempFormPreview(t_form_id,$(this).data('number'));
                });
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:res.msg_respose
                });
            }
        },
        error:function(){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un error, favor de intentarlo de nuevo.'
            });
        }
    });
}
