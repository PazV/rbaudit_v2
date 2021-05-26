$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    loadTemplatesTable();
    console.log(me.user_info)
    if (window.location.pathname=='/templates/preview/'+me.user_info['template_factor']+'/'+me.user_info['t_form_id']){
        loadTempFormPreview(me.user_info['t_form_id'],1);
    }
    if (window.location.pathname.includes('/templates/review-request')){

        $.ajax({
            url:'/project/getProjectRequestTemplateInfo',
            type:'POST',
            data:JSON.stringify({'project_request_id':me.user_info['project_request_id']}),
            success:function(response){

                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $("#RPRprojectRequestInfo").append('<p>'+res.data+'</p>');
                }
                else {
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
        });
        loadTableProjectRequestReview(me.user_info['project_request_id']);
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
            console.log(form_input[x].id);
            if (form_input[x].id!=='tax_form_description' && form_input[x].id!=='taxFormFile'){
                if ($("#"+form_input[x].id).hasClass('invalid-field')){
                    valid=false;
                    break
                }
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
            if ($("#taxFormFile")[0].files.length>0){
                var tax_file = $("#taxFormFile")[0].files[0];
                var tax_file_name=$("#taxFormFile")[0].files[0].name;
            }
            else{
                var tax_file ='';
                var tax_file_name = '';
            }
            data.append(tax_file_name,tax_file);
            data.append('tax_file_name',tax_file_name);
            data.append('tax_form_description',$("#tax_form_description").val());

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
                            content:'El formulario ha sido creado.',
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        loadTemplatesTable();
                                        // window.open('/templates/preview/'+res.template_factor+'/'+res.t_form_id,'_blank');

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

    $("#btnRestoreProjRequest").click(function(){
        $.ajax({
            url:'/templates/restoreProjRequest',
            type:'POST',
            data:JSON.stringify({'project_request_id':me.user_info.project_request_id}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    loadTableProjectRequestReview(me.user_info.project_request_id);
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
    });

    $("#btnRestoreProjectRequestForm").click(function(){
        $.ajax({
            url:'/templates/restoreProjRequestForms',
            type:'POST',
            data:JSON.stringify({'project_request_id':$("#mod_project_template_settings").data('project_request_id')}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    getGrdProjectRequestTemplate($("#mod_project_template_settings").data('project_request_id'));
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
    });

    $("#btnApproveProjRequest").click(function(){
        EasyLoading.show({
            text:'Cargando...',
            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
        });
        $.ajax({
            url:'/project/createProjectFromProjReq',
            type:'POST',
            data:JSON.stringify({'project_request_id':me.user_info['project_request_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                EasyLoading.hide();
                if (res.success){
                    window.location.pathname='/my-projects/'
                }
                else{
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response
                    })
                }
            },
            failure:function(){
                EasyLoading.hide();
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Ocurrió un error, favor de intentarlo de nuevo.'
                });
            }
        });
    });

////para editar nombre de carpeta
    $("#btnEditTempFolder").click(function(){
        if ($(".checkbox-folder-menu:checked").length+$(".checkbox-form-menu:checked").length>1){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debes seleccionar solo un elemento para editarlo'
            });
        }
        else{
            if ($(".checkbox-folder-menu:checked").length+$(".checkbox-form-menu:checked").length==1){
                if ($(".checkbox-folder-menu:checked").length==1){ //editar carpeta
                    $("#mod_add_folder").data('mode','edit');
                    $("#mod_add_folder").find('.spn-modal-header').html('Editar carpeta');
                    $("#divFIparent").css('display','none');
                    $("#FIname").val($(".checkbox-folder-menu:checked").next('div').find('.mp-a-folder')[0].title);
                    $("#mod_add_folder").data('folder_id',$(".checkbox-folder-menu:checked").data('document'));
                    $("#mod_add_folder").modal("show");
                }
                else{ //editar formulario
                    if (window.location.pathname.includes('/my-projects/consultant')){
                        var ws=$("#myProjectsConsultWorkspace").find("option:selected").attr("name");
                    }
                    else{
                        var ws=me.user_info['workspace_id'];
                    }
                    $.ajax({
                        url:'/project/getSettingsForEditing',
                        type:'POST',
                        data:JSON.stringify({'form_id':$(".checkbox-form-menu:checked").data('document'),'user_id':me.user_info['user_id'],'project_id':$("#aHomeMP").data('projectid'),'workspace_id':ws}),
                        success:function(response){
                            try{
                                var res=JSON.parse(response);
                            }catch(err){
                                ajaxError();
                            }
                            if (res.success){
                                if (res.data.status_id==2 || res.data.status_id==1){
                                    $("#btnEditPublishingInfo").css("display",'none');
                                }
                                else{
                                    $("#btnEditPublishingInfo").css("display",'initial');
                                }
                                $("#EFSname").val(res.data.name);
                                $("#EFSfolder").val(res.data.folder_name);
                                $("#EFSrows").val(res.data.rows);
                                $("#EFScolumns").val(res.data.columns_number);
                                $("#mod_edit_form_settings").data('form_id',res.data.form_id);
                                $("#mod_edit_form_settings").data('folder_id',res.data.folder_id);
                                $("#mod_edit_form_settings").data('rows',res.data.rows);
                                $("#mod_edit_form_settings").data('columns_number',res.data.columns_number);
                                $("#frmEditColumnsSettings").empty();
                                var column_cont=1;
                                for (var x of res.data.columns){
                                    $("#frmEditColumnsSettings").append('<fieldset class="form-fieldset original-column"><legend class="form-fieldset-legend">Columna '+x['order']+'</legend><div class="form-group row"><label class="col-sm-2 col-form-label" >Nombre: </label><div class="col-sm-10"><input type="text" class="form-control" placeholder="Nombre de la columna" name="col_'+x['order']+'" value="'+x['name']+'"/></div></div><div class="row" style="display: flex; flex-flow: row nowrap; justify-content: space-between;"><div class="col-sm-10"><div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="checkcol_'+x['order']+'" name="checkcol_'+x['order']+'"><label class="form-check-label" for="checkcol_'+x['order']+'">Editable</label></div><div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="checkdel_'+x['order']+'" name="checkdel_'+x['order']+'"><label class="form-check-label" for="checkdel_'+x['order']+'">Borrar información de la columna</label></div></div><div style="margin-right:15px; margin-bottom:2px;"><button type="button" class="btn btn-danger btn-sm remove-column-fieldset" style="padding:1px 5px;" data-toggle="tooltip" title="Eliminar columna"><i class="fa fa-trash"></i></button></div></div></fieldset>')


                                    column_cont++;
                                    if (x['editable']==true){
                                        $("#checkcol_"+x['order']).prop("checked",true);
                                    }
                                }
                                $(".remove-column-fieldset").click(function(){
                                    if ($($(this).parents('fieldset')).hasClass('original-column')){
                                        var element=this;
                                        $.confirm({
                                            theme:'dark',
                                            title:'Atención',
                                            content:'Al eliminar una columna que ya se encuentra en el formulario, también será <b>ELIMINADA LA INFORMACIÓN</b> contenida en dicha columna, ¿deseas continuar?',
                                            buttons:{
                                                confirm:{
                                                    text:'Sí',
                                                    action:function(){
                                                        $(element).parents('fieldset').remove();
                                                        var col_number=parseInt($("#EFScolumns").val())-1;
                                                        $("#EFScolumns").val(col_number);
                                                    }
                                                },
                                                cancel:{
                                                    text:'No'
                                                }
                                            }
                                        });
                                    }
                                    else{
                                        $(this).parents('fieldset').remove();
                                        var col_number=parseInt($("#EFScolumns").val())-1;
                                        $("#EFScolumns").val(col_number);
                                    }
                                });

                                $("#frmEditColumnsSettings").find('.form-control:last').on('focusout',function(){
                                    var input=$(this);
                                    if (input[0].value.trim().length>0){ //valida si es diferente de vacio y verifica que no tenga puros espacios vacios
                                        input.removeClass("invalid-field").addClass("valid-field");
                                    }
                                    else{
                                        input.removeClass("valid-field").addClass("invalid-field");
                                    }
                                });
                                $("#mod_edit_form_settings").modal("show");

                            }
                            else{
                                $.alert({
                                    theme:'dark',
                                    title:'Error',
                                    content:res.msg_response
                                });
                            }
                        },
                        error:function(){
                            $.alert({
                                theme:'dark',
                                title:'Error',
                                content:'Ocurrió un error, favor de intentarlo de nuevo.'
                            });
                        }
                    });



                }
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Debes seleccionar un elemento para editarlo.'
                });
            }
        }
    });

    ////para eliminar carpeta
    $("#btnDeleteTempFolder").click(function(){
        if ($(".checkbox-folder-menu:checked").length+$(".checkbox-form-menu:checked").length>0){
            $.confirm({
                theme:'dark',
                title:'Atención',
                content:'¿Está seguro que desea eliminar el contenido seleccionado? (UNA VEZ ELIMINADA, NO PODRÁ SER RECUPERADA DICHA INFORMACIÓN)',
                buttons:{
                    confirm:{
                        text:'Sí',
                        action:function(){
                            var folders=[];
                            for (x of $(".checkbox-folder-menu:checked")){
                                folders.push($(x).data('document'));
                            }
                            var forms=[];
                            for (y of $(".checkbox-form-menu:checked")){
                                forms.push($(y).data('document'));
                            }

                            EasyLoading.show({
                                text:'Cargando...',
                                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                            });
                            $.ajax({
                                url:'/project/deleteMenuElements',
                                type:'POST',
                                data:JSON.stringify({'user_id':me.user_info['user_id'],'project_id':$("#aHomeMP").data('projectid'),'forms':forms,'folders':folders}),
                                success:function(response){
                                    EasyLoading.hide();
                                    try{
                                        var res=JSON.parse(response);
                                    }catch(err){
                                        ajaxError();
                                    }
                                    if (res.success){
                                        if ($("#div-include-fmp").children().length==0){
                                            getFirstMenuFolders($("#aHomeMP").data('projectid'));
                                        }
                                        else{
                                            getSubfoldersForms($("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder'),$("#aHomeMP").data('projectid'));
                                        }
                                        // loadTreeMenu(me.user_info['project_id']);
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
                                    $.alert({
                                        theme:'dark',
                                        title:'Atención',
                                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
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
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe seleccionar al menos un elemento para eliminarlo.'
            });
        }
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

function loadTableProjectRequestReview(project_request_id){
    $("#grdProjectRequestReview").DataTable({
        "scrollY":"350px",
        "scrollCollapse":true,
        "lengthChange":false,
        serverSide:true,
        destroy:true,
        searching:false,
        ordering:false,
        ajax:{
            data:{'project_request_id':project_request_id},
            url:'/templates/getTableReviewProjectRequest',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'folder',"width":"20%", "className":"dt-head-center dt-body-left"},
            {data:'name',"width":"20%", "className":"dt-head-center dt-body-left"},
            {data:'assigned_to',"width":"15%", "className":"dt-head-center dt-body-center"},
            {data:'revisions',"width":"20%", "className":"dt-head-center dt-body-center"},
            {data:'resolve_before',"width":"15%", "className":"dt-head-center dt-body-center"},
            {data:'actions',"width":"10%", "className":"dt-head-center dt-body-center"},
        ]

    });
}
