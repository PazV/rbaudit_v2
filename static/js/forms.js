$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    if (window.location.pathname.includes('/step-2/')){
        loadFormTable(me.user_info['form_id'],1,me.user_info['user_id']);
    }

    if (window.location.pathname=='/project/'+me.user_info['project_factor']+'/'+me.user_info['form_id']){
        getFormToResolve(me.user_info['project_id'],me.user_info['form_id'],1,me.user_info['user_id']);
        getFormObservations(me.user_info);
        getFormDocuments(me.user_info);
        getFormPath(me.user_info);

    }

    // $("#btnGotoFormStep2").click(function(){
    $("#btnSaveCreateForm").click(function(){
        $("#frmCreateformStep1 :input").focusout();
        $("#frmColumnsSettings .form-control").focusout();
        var form_input=$("#frmCreateformStep1 .form-control");
        var valid=true;
        for (var x in form_input){
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
                break
            }
        }
        var form_columns=$("#frmColumnsSettings .form-control");
        var form_checks=$("#frmColumnsSettings .custom-control-input")
        var col_valid=true;
        for (var y in form_columns){
            if (form_columns[y].type=='text'){
                if ($(form_columns[y]).hasClass('invalid-field')){
                    col_valid=false;
                    break
                }
            }
        }
        if (valid===true && col_valid){
            var data=getForm("#frmCreateformStep1");
            if (parseInt(data['rows'])>0){
                if (parseInt(data['columns_number'])>0){
                    data['user_id']=me.user_info['user_id'];
                    // data['project_id']=me.user_info['project_id'];
                    data['project_id']=$("#aHomeMP").data('projectid');
                    data['form_id']=-1;
                    // data['folder_id']=$(".file-tree").find('.selected').data('folder');
                    data['folder_id']=$("#newFormFolder").data('folderid');

                    var form_2=getForm("#frmColumnsSettings",null,true);
                    data['columns_info']=form_2;
                    $.ajax({
                        url:'/project/saveFormStep1',
                        type:'POST',
                        data:JSON.stringify(data),
                        success:function(response){
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
                                                if ($("#div-include-fmp-mod").children().length==0){
                                                    getFirstMenuFolders($("#aHomeMP").data('projectid'));
                                                }
                                                else{
                                                    getSubfoldersForms($("#div-include-fmp-mod").children('.div-return-menu-subfolder-mod').last().find('a').data('folder'),$("#aHomeMP").data('projectid'));

                                                    var path_children=$("#div-include-fmp-mod").children('.div-return-menu-subfolder-mod');
                                                    $("#div-include-fmp").empty();
                                                    $("#div-include-fmp").addClass('row');
                                                    console.log(path_children);
                                                    for (var x of path_children){
                                                        console.log($(x).find('a.return-menu-subfolder-mod').data('folder'));
                                                        $("#div-include-fmp").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(x)[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$(x).find('a.return-menu-subfolder-mod').data('folder')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(x)[0].title+'</span></i></a><div>');
                                                    }
                                                    $(".return-menu-subfolder").click(function(e){
                                                        returnSubFolder($(e.currentTarget).data('folder'),$("#aHomeMP").data('projectid'));
                                                        $(e.currentTarget).parent('.div-return-menu-subfolder').remove();
                                                    });

                                                }



                                                var project_factor=$("#aHomeMP").data('projectfactor');
                                                // window.location.pathname='/project/'+project_factor+'/createform/step-2/'+res.form_id;
                                                window.open('/project/'+project_factor+'/createform/step-2/'+res.form_id,'_blank');
                                                loadFormTable(res.form_id,1,me.user_info['user_id']);
                                                $("#mod_create_form").modal('hide');
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
                        failure:function(){
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
                        content:'El formulario debe contener al menos una columna.'
                    });
                }
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'El formulario debe contener al menos una fila.'
                });
            }
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Existen campos vacíos o incorrectos.'
            });
        }
        //
    });

    $("#btnAddOption").click(function(){
        $("#divListOptions").append('<div class="form-group row added-option"><label class="col-sm-3 col-form-label col-form-label-sm" >Opción 2: </label><div class="col-sm-7"><input type="text" class="form-control form-control-sm" placeholder="Opción 2"/></div></div>');
    });

    $("#btnRemoveOption").click(function(){
        $(".added-option:last-child").remove();
    });

    $("#frmCreateformStep1 .form-control").focusout(function(){
        var id="#"+this.id;
        var error_id="#err"+this.id;
        emptyField(id,error_id);
    });

    $("#btnFinishForm").click(function(){

    });

    $("#btnAddColumn").click(function(){
        var col_number=parseInt($("#newFormColumns").val())+1;
        $("#newFormColumns").val(col_number);
        var col_name='col_'+col_number;
        var a=$("#frmColumnsSettings").append('<fieldset class="form-fieldset"><legend class="form-fieldset-legend">Columna '+col_number+'</legend><div class="form-group row"><label class="col-sm-2 col-form-label col-form-label-sm">Nombre: </label><div class="col-sm-10"><input type="text" class="form-control form-control-sm" placeholder="Nombre de la columna" name="'+col_name+'"/></div></div><div class="col-sm-4"><div class="custom-control custom-checkbox"><input class="custom-control-input" type="checkbox" value="" id="check'+col_name+'" name="check'+col_name+'"><label class="custom-control-label" for="check'+col_name+'">Editable</label></div></div></fieldset>');

        $(a).find('.form-control:last').on('focusout',function(){
            var input=$(this);
            if (input[0].value.trim().length>0){ //valida si es diferente de vacio y verifica que no tenga puros espacios vacios
                input.removeClass("invalid-field").addClass("valid-field");
            }
            else{
                input.removeClass("valid-field").addClass("invalid-field");
            }
        });
        $("#frmColumnsSettings").animate({ scrollTop: $('#frmColumnsSettings').prop("scrollHeight")}, 1000);
    });

    $("#frmColumnsSettings .form-control").focusout(function(){
        var input=$(this);
        if (input[0].value.trim().length>0){ //valida si es diferente de vacio y verifica que no tenga puros espacios vacios
            input.removeClass("invalid-field").addClass("valid-field");
        }
        else{
            input.removeClass("valid-field").addClass("invalid-field");
        }
    });

    $("#btnRemoveColumn").click(function(){
        if (parseInt($("#newFormColumns").val())>0){ //valida que no se pueda poner menos de cero en columnas
            var col_number=parseInt($("#newFormColumns").val())-1;
            $("#newFormColumns").val(col_number);
            $("#frmColumnsSettings").find("fieldset:last-child").remove();
        }
    });

    $("#btnSavePrefilledForm").click(function(){
        saveTableInfo("#grdPrefilledForm",'/project/savePrefilledForm',me.user_info,true);
    });

    $("#btnPublishForm").click(function(){
        $("#mod_publish_form").data('mode','new');
        $("#mod_publish_form").modal("show");
        loadRevisionUsers("#FTPassigned_to",me.user_info['project_id']);
        loadRevisionUsers("#FTPrevision_1",me.user_info['project_id']);

    });

    $("#mod_publish_form").on('hidden.bs.modal',function(){
        resetForm("#frmFormToPublish",['input|INPUT','select|SELECT']);
        $("#FTPrevisions").empty();
    });

    $("#mod_publish_form").on('show.bs.modal',function(){
        $("#btnPFpublishForm").attr("disabled",false);
    });

    $("#btnFTPaddRevision").click(function(){
        console.log($("#mod_publish_form").data('mode'));
        if ($("#mod_publish_form").data('mode')=='edit'){
            var revision_number=$("#FTPrevisions").children().length+2;
            $("#FTPrevisions").append('<div class="form-group row" style="padding-top:5px;"><label for="FTPrevision_'+revision_number+'" class="col-sm-3 col-form-label">Revisión '+revision_number+': </label><div class="col-sm-7"><select class="form-control" id="FTPrevision_'+revision_number+'" name="revision_'+revision_number+'" data-revision="'+revision_number+'"></select></div>');
            $("#FTPrevision_"+revision_number).data('currently_assigned',false);
            loadRevisionUsers("#FTPrevision_"+revision_number,me.user_info['project_id']);
        }
        else{
            if ($("#FTPrevisions").children().last().length==0){
                $("#FTPrevisions").append('<div class="form-group row" style="padding-top:5px;"><label for="FTPrevision_2" class="col-sm-3 col-form-label">Revisión 2: </label><div class="col-sm-7"><select class="form-control" id="FTPrevision_2" name="revision_2" data-revision="2"></select></div>');
                loadRevisionUsers("#FTPrevision_2",me.user_info['project_id']);
            }
            else{
                var revision_number=$("#FTPrevisions").children().length+2;
                $("#FTPrevisions").append('<div class="form-group row" style="padding-top:5px;"><label for="FTPrevision_'+revision_number+'" class="col-sm-3 col-form-label">Revisión '+revision_number+': </label><div class="col-sm-7"><select class="form-control" id="FTPrevision_'+revision_number+'" name="revision_'+revision_number+'" data-revision="'+revision_number+'"></select></div>');
                loadRevisionUsers("#FTPrevision_"+revision_number,me.user_info['project_id']);
            }
        }
    });

    $("#btnFTPremoveRevision").click(function(){
        console.log($("#mod_publish_form").data('mode'));
        if ($("#mod_publish_form").data('mode')){
            console.log($("#FTPrevisions").children().last());
            if (!$("#FTPrevisions").children().last().is('disabled')){
                console.log($("#FTPrevisions").children().last());
                if ($("#FTPrevisions").children().last().find('select').data('currently_assigned')===false){
                    $("#FTPrevisions").children().last().remove();
                }
                else{
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:'Este revisor no puede ser eliminado, porque tiene asignada la revisión actual. Es posible, asignar la revisión a alguien más.'
                    });
                }
            }
        }
        else{
            $("#FTPrevisions").children().last().remove();
        }
    });

    $("#FTPresolve_date").focusout(function(){
        emptyField("#FTPresolve_date","#errFTPresolve_date");
    });

    $("#btnPFpublishForm").click(function(){
        $("#btnPFpublishForm").prop("disabled",true);
        $("#FTPresolve_date").focusout();
        if ($("#FTPresolve_date").hasClass('valid-field')){
            if ($("#mod_publish_form").data('mode')=='new'){
                var url='/project/publishForm';
                saveTableInfo("#grdPrefilledForm",'/project/savePrefilledForm',me.user_info,false);
            }
            else{
                var url='/project/editPublishingInfo';
            }
            var sel_list=[{'id':'#FTPassigned_to','name':'assigned_to'},{'id':'#FTPrevision_1','name':'revision_1'}];
            var revisions=$("#FTPrevisions").children();
            for (var x of revisions){
                sel_list.push({'id':'#'+$(x).find('select')[0].id,'name':$(x).find('select')[0].name});
            }
            var data=getForm("#frmFormToPublish",sel_list,true);
            data['project_id']=me.user_info['project_id'];
            data['form_id']=me.user_info['form_id'];
            data['user_id']=me.user_info['user_id'];
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });

            $.ajax({
                url:url,
                type:'POST',
                data:JSON.stringify(data),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        EasyLoading.hide();
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response,
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        $("#mod_publish_form").modal("hide");
                                        if ($("#mod_publish_form").data('mode')=='new'){
                                            window.location.pathname='/project/'+me.user_info.project_factor;
                                        }
                                        else{
                                            // window.location.reload();
                                        }
                                    }
                                }
                            }
                        });
                    }
                    else{
                        EasyLoading.hide();
                        $("#btnPFpublishForm").prop("disabled",false);
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                    }
                },
                error:function(){
                    EasyLoading.hide();
                    $("#btnPFpublishForm").prop("disabled",false);
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                    });
                }
            });
        }
        else{
            $("#btnPFpublishForm").prop("disabled",false);
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe seleccionar una fecha para publicar el formulario.'
            });
        }

    });

    $("#btnSaveResolvedForm").click(function(){
        saveTableInfo("#grdFormToResolve",'/project/saveResolvingForm',me.user_info,true);
    });

    $("#btnSeeFormDetails").click(function(){
        $.ajax({
            url:'/project/getFormDetails',
            type:'POST',
            data:JSON.stringify({'form_id':me.user_info['form_id'],'user_id':me.user_info['user_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $("#divFormDetails").html(res.data);
                    $("#mod_form_details").modal("show");
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
    });

    $("#btnSendToRevision").click(function(){
        $.confirm({
            theme:'dark',
            title:'Atención',
            content:'Una vez enviado a revisión, este formulario no podrá ser editado, ¿desea continuar?',
            buttons:{
                confirm:{
                    text:'Sí',
                    action:function(){
                        //Verificar si puede enviar a revisión
                        $.ajax({
                            url:'/project/checkSendToRevision',
                            type:'POST',
                            data:JSON.stringify({'form_id':me.user_info['form_id'],'user_id':me.user_info['user_id']}),
                            success:function(response){
                                try{
                                    var res=JSON.parse(response);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res.success){
                                    if (res.allowed){
                                        //se guardan cambios antes de enviar a revisión
                                        saveTableInfo("#grdFormToResolve",'/project/saveResolvingForm',me.user_info,false);
                                        var data={
                                            'form_id':me.user_info['form_id'],
                                            'project_id':me.user_info['project_id'],
                                            'user_id':me.user_info['user_id']
                                        };
                                        EasyLoading.show({
                                            text:'Cargando...',
                                            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                                        })
                                        $.ajax({
                                            url:'/project/sendFormToRevision',
                                            type:'POST',
                                            data:JSON.stringify(data),
                                            success:function(response){
                                                EasyLoading.hide();
                                                try{
                                                    var res=JSON.parse(response);
                                                }catch(err){
                                                    ajaxError();
                                                }
                                                //cargar panel de pendientes por revisar
                                                window.location.pathname='/project/'+me.user_info.project_factor;
                                            },
                                            error:function(){
                                                EasyLoading.hide();
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
        })
    });

    $("#btnFinishRevision").click(function(){
        EasyLoading.show({
            text:'Cargando...',
            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
        });
        $.ajax({
            url:'/project/checkToDoRevision',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'project_id':me.user_info['project_id'],'form_id':me.user_info['form_id']}),
            success:function(response){
                EasyLoading.hide();
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    if (res.allowed){
                        //mostrar modal de finalizar revisión
                        $("#mod_finish_checking_form").modal("show");
                    }
                    else{
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                    }
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
    });

    $("#btnModSendToRevision").click(function(){
        var data={};
        data['msg']=$("#FCHFmessage").val();
        data['form_id']=me.user_info['form_id'];
        data['user_id']=me.user_info['user_id'];
        data['project_id']=me.user_info['project_id'];
        if ($(".revision-radio input[type=radio]:checked")[0].value=='next'){
            data['to']='next';
            data['user_to']=$("#FCHFsend_to").find("option:selected").attr("name");
        }
        else{
            data['to']='return';
            data['user_to']=$("#FCHFreturn_to").find("option:selected").attr("name");
        }
        if (data['user_to']==-101){
            $.confirm({
                theme:'dark',
                title:'Atención',
                content:'Al cerrar el formulario, ya no podrá ser editado por nadie, ¿deseas continuar?',
                buttons:{
                    confirm:{
                        text:'Sí',
                        action:function(){
                            EasyLoading.show({
                                text:'Cargando...',
                                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                            });
                            $.ajax({
                                url:'/project/doRevision',
                                type:'POST',
                                data:JSON.stringify(data),
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
                                            content:res.msg_response,
                                            buttons:{
                                                confirm:{
                                                    text:'Aceptar',
                                                    action:function(){
                                                        $("#mod_finish_checking_form").modal("hide");
                                                        window.location.reload();
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
                    },
                    cancel:{
                        text:'No'
                    }
                }
            });
        }
        else{
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/doRevision',
                type:'POST',
                data:JSON.stringify(data),
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
                            content:res.msg_response,
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        $("#mod_finish_checking_form").modal("hide");
                                        window.location.reload();
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
    });

    $("#btnFinishCheckingForm").click(function(){
        var data={};
        data['msg']=$("#FCHFmessage").val();
        data['form_id']=me.user_info['form_id'];
        data['user_id']=me.user_info['user_id'];
        data['project_id']=me.user_info['project_id'];
        EasyLoading.show({
            text:'Cargando...',
            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
        });
        $.ajax({
            url:'/project/finishCheckingForm',
            type:'POST',
            data:JSON.stringify(data),
            success:function(response){
                EasyLoading.hide();
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    var location=window.location.pathname;
                    loadFormsToCheck(me.user_info,location);
                    $("#mod_finish_checking_form").modal("hide");
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
    });

    $("#btnFormAddComment").click(function(){
        console.log(me.user_info);
        $.ajax({
            url:'/project/checkAddComment',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id'],'is_consultant':me.user_info.consultant}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    if (res.access){
                        $("#mod_add_form_comment").modal("show");
                    }
                    else{
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                    }
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
    });

    $("#btnAFMsaveComment").click(function(){
        // var data={};
        var data = new FormData();
        // data['comment']=$("#AFMcomment").val().trim();
        data.append('comment',$("#AFMcomment").val().trim());
        // if (data['comment']!==''){
        if ($("#AFMcomment").val().trim()!==''){
            $("#btnAFMsaveComment").prop("disabled",true);
            // data['user_id']=me.user_info['user_id'];
            // data['form_id']=me.user_info['form_id'];
            // data['project_id']=me.user_info['project_id'];
            data.append('user_id',me.user_info['user_id']);
            data.append('form_id',me.user_info['form_id']);
            data.append('project_id',me.user_info['project_id']);
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/addFormComment',
                type:'POST',
                // data:JSON.stringify(data),
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
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response
                    });
                    if (res.success){
                        $("#mod_add_form_comment").modal("hide");
                    }
                    else{
                        $("#btnAFMsaveComment").prop("disabled",false);
                    }
                },
                error:function(){
                    EasyLoading.hide();
                    $("#btnAFMsaveComment").prop("disabled",false);
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
                content:'Debes agregar un comentario.'
            });
        }
    });

    $("#mod_add_form_comment").on('hide.bs.modal',function(){
        $("#AFMcomment").val("");
        $("#btnAFMsaveComment").prop("disabled",false);
    })

    $("#btnFormSeeComments").click(function(){
        $.ajax({
            url:'/project/getFormComments',
            type:'POST',
            data:JSON.stringify({'form_id':me.user_info['form_id'],'user_id':me.user_info['user_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    //crear divs de comentarioss
                    $("#divFormComments").empty();
                    if (res.data.length!=0){
                        for (var x of res.data){
                            $("#divFormComments").append('<div class="div-form-comment"><p class="comment-content">'+x['comment']+'</p><span class="comment-author">'+x['author']+'</span></div>');
                        }
                    }
                    else{
                        $("#divFormComments").append('<div class="comment-content">No ha sido agregada ninguna observación.</div>');
                    }
                    $("#mod_see_form_comments").modal("show");
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
    });

    $("#frmCreateformStep1Import .form-control,.custom-file-input").focusout(function(){
        var id="#"+this.id;
        var error_id="#err"+this.id;
        emptyField(id,error_id);
        if (this.id=='newFormImportFile'){
            var pattern=$("#"+this.id)[0].pattern.split(",");
            if (hasExtension(this.id,pattern)){
                $("#"+this.id).parent('.custom-file').addClass('valid-file-field').removeClass('invalid-file-field');
                $("#err"+this.id).removeClass('show-error-msg').addClass('hide-error-msg');
            }
            else{
                $("#"+this.id).parent('.custom-file').removeClass('valid-file-field').addClass('invalid-file-field');
                $("#err"+this.id).html("Formato incorrecto");
                $("#err"+this.id).addClass('show-error-msg').removeClass('hide-error-msg');
            }
        }
    });

    $("#newFormImportFile").on('change',function(){
        var path=$("#newFormImportFile")[0].value.split("\\").pop();
        $("#newFormImportFile").siblings("label").html(path);
        var pattern=$("#newFormImportFile")[0].pattern.split(",");
        if (hasExtension("newFormImportFile",pattern)){
            $("#newFormImportFile").parent('.custom-file').addClass('valid-file-field').removeClass('invalid-file-field');
            $("#errnewFormImportFile").removeClass('show-error-msg').addClass('hide-error-msg');
        }
        else{
            $("#newFormImportFile").parent('.custom-file').removeClass('valid-file-field').addClass('invalid-file-field');
            $("#errnewFormImportFile").html("Formato incorrecto");
            $("#errnewFormImportFile").addClass('show-error-msg').removeClass('hide-error-msg');
        }
        this.blur();
    });

    $("#btnSaveCreateFormImport").click(function(){
        $("#frmCreateformStep1Import .form-control,.custom-file-input").focusout();
        var valid=false;
        var form_input=$("#frmCreateformStep1Import :input");
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
            // data.append('project_id',me.user_info['project_id']);
            data.append('project_id',$("#aHomeMP").data('projectid'));
            data.append('form_id',-1);
            // data.append('folder_id',$(".file-tree").find('.selected').data('folder'));
            data.append('folder_id',$("#newFormImportFolder").data('folderid'));
            data.append('name',$("#newFormImportName").val());
            var file = $("#newFormImportFile")[0].files[0];
            var file_name=$("#newFormImportFile")[0].files[0].name;
            data.append(file_name,file);
            data.append('file_name',file_name);
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/importNewForm',
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

                                        if ($("#div-include-fmp-mod-import").children().length==0){
                                            getFirstMenuFolders($("#aHomeMP").data('projectid'));
                                        }
                                        else{
                                            getSubfoldersForms($("#div-include-fmp-mod-import").children('.div-return-menu-subfolder-mod').last().find('a').data('folder'),$("#aHomeMP").data('projectid'));

                                            var path_children=$("#div-include-fmp-mod-import").children('.div-return-menu-subfolder-mod');
                                            $("#div-include-fmp").empty();
                                            $("#div-include-fmp").addClass('row');
                                            console.log(path_children);
                                            for (var x of path_children){
                                                console.log($(x).find('a.return-menu-subfolder-mod').data('folder'));
                                                $("#div-include-fmp").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(x)[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$(x).find('a.return-menu-subfolder-mod').data('folder')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(x)[0].title+'</span></i></a><div>');
                                            }
                                            $(".return-menu-subfolder").click(function(e){
                                                returnSubFolder($(e.currentTarget).data('folder'),$("#aHomeMP").data('projectid'));
                                                $(e.currentTarget).parent('.div-return-menu-subfolder').remove();
                                            });

                                        }



                                        var project_factor=$("#aHomeMP").data('projectfactor');
                                        // window.location.pathname='/project/'+project_factor+'/createform/step-2/'+res.form_id;
                                        window.open('/project/'+project_factor+'/createform/step-2/'+res.form_id,'_blank');
                                        loadFormTable(res.form_id,1,me.user_info['user_id']);
                                        $("#mod_create_form_import").modal('hide');




                                    }
                                }
                            }
                        })

                        // window.location.pathname='/project/'+me.user_info.project_factor;
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

    $("#btnDownloadForm").click(function(){
        $.ajax({
            url:'/project/checkAllowedDownload',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'project_id':me.user_info['project_id'],'form_id':me.user_info['form_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    if (res.allowed){
                        $.ajax({
                            url:'/project/doDownloadResolvedForm',
                            type:'POST',
                            data:JSON.stringify({'form_id':me.user_info['form_id'],'project_id':me.user_info['project_id'],'user_id':me.user_info['user_id']}),
                            success:function(response2){
                                try{
                                    var res2=JSON.parse(response2);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res2.success){
                                    $.alert({
                                        theme:'dark',
                                        title:'Atención',
                                        content:res2.msg_response,
                                        buttons:{
                                            confirm:{
                                                text:'Descargar',
                                                action:function(){
                                                    window.open(res2.filename,"_blank");
                                                }
                                            }
                                        }
                                    });
                                }
                                else{
                                    $.alert({
                                        theme:'dark',
                                        title:'Atención',
                                        content:res2.msg_response
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
                    else{
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                    }
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
    });

    $("#btnUploadFormFolder").click(function(){
        $.ajax({
            url:'/project/allowedFormZip',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id'],'from':'upload'}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    if (res.allowed){
                        $("#mod_upload_form_folder").modal("show");
                    }
                    else{
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                    }
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
    });

    $("#mod_upload_form_folder").on('hide.bs.modal',function(){
        $("#UFFzip_file").parent('.custom-file').removeClass('valid-file-field');
        $("#UFFzip_file").parent('.custom-file').removeClass('invalid-file-field');
        $("#errUFFzip_file").addClass('hide-error-msg').removeClass('show-error-msg');
        $("#UFFzip_file").siblings("label").html('Seleccione archivo');
        $("#UFFzip_file").val("");
    });

    $("#UFFzip_file").on('change',function(){
        var path=$("#UFFzip_file")[0].value.split("\\").pop();
        $("#UFFzip_file").siblings("label").html(path);
        // var pattern=$("#UFFzip_file")[0].pattern.split(",");
        // if (hasExtension("UFFzip_file",pattern)){
        //     $("#UFFzip_file").parent('.custom-file').addClass('valid-file-field').removeClass('invalid-file-field');
        //     $("#errUFFzip_file").removeClass('show-error-msg').addClass('hide-error-msg');
        // }
        // else{
        //     $("#UFFzip_file").parent('.custom-file').removeClass('valid-file-field').addClass('invalid-file-field');
        //     $("#errUFFzip_file").html("Formato incorrecto");
        //     $("#errUFFzip_file").addClass('show-error-msg').removeClass('hide-error-msg');
        // }
        this.blur();
    });

    $("#btnUploadZip").click(function(){
        if ($("#UFFzip_file")[0].files.length==1){
            var data=new FormData();
            data.append('form_id',me.user_info['form_id']);
            data.append('user_id',me.user_info['user_id']);
            data.append('project_id',me.user_info['project_id']);
            var file=$("#UFFzip_file")[0].files[0];
            var file_name=$("#UFFzip_file")[0].files[0].name;
            data.append(file_name,file);
            data.append('file_name',file_name);
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/uploadFormZipFile',
                type:'POST',
                data:data,
                processData:false,
                contentType:false,
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    EasyLoading.hide();
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response
                    });
                    if (res.success){
                        $("#mod_upload_form_folder").modal("hide");
                        getFormDocuments(me.user_info);
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
                content:'Debe seleccionar un archivo para cargarlo.'
            });
        }
    });

    $("#btnDownloadFormFolder").click(function(){
        $.ajax({
            url:'/project/allowedFormZip',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id'],'from':'download'}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    if (res.allowed){
                        $.ajax({
                            url:'/project/getFormDocuments',
                            type:'POST',
                            data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id'],'project_id':me.user_info['project_id']}),
                            success:function(response2){
                                try{
                                    var res2=JSON.parse(response2);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res2.success){
                                    $("#divDownloadFilesContainer").empty();
                                    $("#divDownloadFilesContainer").append(res2.data);
                                    $("#mod_download_form_files").modal("show");
                                }
                                else{
                                    $.alert({
                                        theme:'dark',
                                        title:'Atención',
                                        content:res2.msg_response
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
    });

    $("#mod_download_form_files").on('hide.bs.modal',function(){
        $("#divDownloadFilesContainer").empty();
        $("#DFFcheck_select_all").prop("checked",false);
    });

    $("#btnDownloadFormFile").click(function(){
        if ($(".checkbox-download-files:checked").length>0){
            var file_list=[];
            for (var x of $(".checkbox-download-files:checked")){
                file_list.push($(x).data('document'));
            }
            $.ajax({
                url:'/project/getDownloadFolderLink',
                type:'POST',
                data:JSON.stringify({'file_list':file_list,'form_id':me.user_info['form_id'],'project_id':me.user_info['project_id'],'user_id':me.user_info['user_id']}),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:'La carpeta ha sido creada.',
                            buttons:{
                                confirm:{
                                    text:'Descargar',
                                    action:function(){
                                        var link='/project/downloadFile/form_zip/'+res.link;
                                        window.open(link,"_blank");
                                    }
                                },
                                cancel:{
                                    text:'Salir'
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
                content:'Debes seleccionar al menos un archivo.'
            });
        }
    });

    $("#DFFcheck_select_all").on('change',function(e){
        if (e.target.checked==true){
            $(".checkbox-download-files").prop("checked",true);
        }
        else{
            $(".checkbox-download-files").prop("checked",false);
        }
    });

    $("#btnDeleteFormFile").click(function(){
        if ($(".checkbox-download-files:checked").length>0){
            html='<ul>'
            for (x of $(".checkbox-download-files:checked")){
                html+='<li>'+$(x).next()[0].textContent+'</li>'
            }
            html+='</ul>'
            if ($(".checkbox-download-files:checked").length==1){
                msg='¿Estás seguro que deseas eliminar el siguiente archivo? :<br>'+html;
            }
            else{
                msg='¿Estás seguro que deseas eliminar los siguientes archivos? :<br>'+html;
            }
            $.confirm({
                theme:'dark',
                title:'Atención',
                content:msg,
                buttons:{
                    confirm:{
                        text:'Sí',
                        action:function(){
                            var files=[];
                            for (x of $(".checkbox-download-files:checked")){
                                files.push($(x).data('document'));
                            }
                            $.ajax({
                                url:'/project/deleteFormFile',
                                type:'POST',
                                data:JSON.stringify({'user_id':me.user_info['user_id'],'files':files,'form_id':me.user_info['form_id'],'project_id':me.user_info['project_id']}),
                                success:function(response){
                                    try{
                                        var res=JSON.parse(response);
                                    }catch(err){
                                        ajaxError();
                                    }
                                    if (res.success){
                                        $.alert({
                                            theme:'dark',
                                            title:'Atención',
                                            content:res.msg_response,
                                            buttons:{
                                                confirm:{
                                                    text:'Aceptar',
                                                    action:function(){
                                                        getFormDocuments(me.user_info);
                                                        // $.ajax({
                                                        //     url:'/project/getFormDocuments',
                                                        //     type:'POST',
                                                        //     data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id'],'project_id':me.user_info['project_id']}),
                                                        //     success:function(response2){
                                                        //         try{
                                                        //             var res2=JSON.parse(response2);
                                                        //         }catch(err){
                                                        //             ajaxError();
                                                        //         }
                                                        //         if (res2.success){
                                                        //             $("#divDownloadFilesContainer").empty();
                                                        //             $("#divDownloadFilesContainer").append(res2.data);
                                                        //             $("#DFFcheck_select_all").prop("checked",false);
                                                        //         }
                                                        //         else{
                                                        //             $.alert({
                                                        //                 theme:'dark',
                                                        //                 title:'Atención',
                                                        //                 content:res2.msg_response
                                                        //             });
                                                        //         }
                                                        //     },
                                                        //     error:function(){
                                                        //         $.alert({
                                                        //             theme:'dark',
                                                        //             title:'Atención',
                                                        //             content:'Ocurrió un error, favor de intentarlo de nuevo.'
                                                        //         });
                                                        //     }
                                                        // });
                                                    }
                                                }
                                            }
                                        })
                                    }
                                    else{
                                        $.alert({
                                            theme:'dark',
                                            title:'Atención',
                                            content:res.msg_response
                                        });
                                    }
                                }
                            });
                        }
                    },
                    cancel:{
                        text:'No',
                        action:function(){

                        }
                    }
                }
            });
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe seleccionar al menos un archivo para eliminarlo.'
            });
        }
    });

    $(".revision-radio input[type=radio]").click(function(){
        if ($(this)[0].value=='return'){
            $("#FCHFreturn_to").prop("disabled",false);
            $("#FCHFsend_to").prop("disabled",true);
        }
        else{
            $("#FCHFreturn_to").prop("disabled",true);
            $("#FCHFsend_to").prop("disabled",false);
        }
    });

    $("#mod_finish_checking_form").on('show.bs.modal',function(){
        $.ajax({
            url:'/project/getUsersForRevision',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    console.log(err);
                    ajaxError();
                }
                if (res.success){
                    $.each(res.send_to,function(i,item){
                        $("#FCHFsend_to").append($('<option>',{
                            text:item.name,
                            name:item.user_id,
                            selected:true
                        }));
                    });
                    $.each(res.return_to,function(i,item){
                        $("#FCHFreturn_to").append($('<option>',{
                            text:item.name,
                            name:item.user_id,
                            selected:true
                        }));
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
    });

    $("#btnPrintingMode").click(function(){
        if (!$("#divResolveFormPrintingInfo").is(":visible")){
            $.ajax({
                url:'/project/getPrintingInfo',
                type:'POST',
                data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id'],'project_id':me.user_info['project_id']}),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        $("#divResolveFormPrintingInfo").empty();
                        $("#divResolveFormPrintingInfo").append(res.html);
                        $("#divResolveFormFormInfo").css("display","none");
                        $("#divResolveFormPrintingInfo").css("display","initial");
                        if ($("#divCollapseTreepanel").is(":visible")){
                            $("#divCollapseTreepanel").collapse("toggle");
                            $("#ibtnCollapseTreepanel").addClass('treepanel-pin-collapsed');
                            $($("#bodyContent").children().children()[0]).css("max-width","5%");
                            $($("#bodyContent").children().children()[0]).removeClass('col-sm-3');
                            $($("#bodyContent").children().children()[1]).removeClass('col-sm-6');
                            $($("#bodyContent").children().children()[1]).css("width","100%");
                            $($("#bodyContent").children().children()[1]).css("max-width","90%");
                        }
                        if ($("#unpublished_panel").is(":visible")){
                            $("#unpublished_panel").collapse("toggle");
                            $("#ibtnCollapseUnpublishedPanel").addClass('unpublished-pin-collapsed');
                            $($("#bodyContent").children().children()[2]).removeClass('col-sm-3');
                            $($("#bodyContent").children().children()[2]).css("max-width","5%");
                            $($("#bodyContent").children().children()[1]).removeClass('col-sm-6');
                            $($("#bodyContent").children().children()[1]).css("width","100%");
                            $($("#bodyContent").children().children()[1]).css("max-width","90%");
                        }

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
                        content:'Ocurrió un error, favor de intentarlo de nuevo más tarde.'
                    });
                }
            });
        }
        else{
            $("#divResolveFormPrintingInfo").css("display","none");
            $("#divResolveFormFormInfo").css("display","initial");
        }
    });

    $("#frmCloneForm .form-control").focusout(function(){
        emptyField("#"+$(this)[0].id,"#err"+$(this)[0].id);
    });

    $("#btnSaveClonedForm").click(function(){
        var inputs=$("#frmCloneForm .form-control");
        var valid=true;
        for (var i of inputs){
            if (i.type=='text'){
                if ($(i).hasClass('invalid-field')){
                    valid=false;
                    break
                }
            }
        }
        if (valid===true){
            var data={};
            data['old_form_id']=$("#oldClonedForm").data('formid');
            data['new_folder_id']=$("#clonedFormFolder").data('folderid');
            data['form_name']=$("#clonedFormName").val();
            data['user_id']=me.user_info['user_id'];
            // data['project_id']=me.user_info['project_id'];
            data['project_id']=$("#aHomeMP").data('projectid');
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/cloneForm',
                type:'POST',
                data:JSON.stringify(data),
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
                            content:'El formulario ha sido clonado, será abierto en una nueva pestaña.',
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        if ($("#div-include-fmp-mod-clone").children().length==0){
                                            getFirstMenuFolders($("#aHomeMP").data('projectid'));
                                        }
                                        else{
                                            getSubfoldersForms($("#div-include-fmp-mod-clone").children('.div-return-menu-subfolder-mod').last().find('a').data('folder'),$("#aHomeMP").data('projectid'));

                                            var path_children=$("#div-include-fmp-mod-clone").children('.div-return-menu-subfolder-mod');
                                            $("#div-include-fmp").empty();
                                            $("#div-include-fmp").addClass('row');
                                            console.log(path_children);
                                            for (var x of path_children){
                                                console.log($(x).find('a.return-menu-subfolder-mod').data('folder'));
                                                $("#div-include-fmp").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(x)[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$(x).find('a.return-menu-subfolder-mod').data('folder')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(x)[0].title+'</span></i></a><div>');
                                            }
                                            $(".return-menu-subfolder").click(function(e){
                                                returnSubFolder($(e.currentTarget).data('folder'),$("#aHomeMP").data('projectid'));
                                                $(e.currentTarget).parent('.div-return-menu-subfolder').remove();
                                            });

                                        }



                                        var project_factor=$("#aHomeMP").data('projectfactor');
                                        // window.location.pathname='/project/'+project_factor+'/createform/step-2/'+res.form_id;
                                        window.open('/project/'+project_factor+'/createform/step-2/'+res.form_id,'_blank');
                                        loadFormTable(res.form_id,1,me.user_info['user_id']);
                                        $("#mod_create_form_clone").modal('hide');
                                    }
                                }
                            }
                        });



                        // window.location.pathname='/project/'+me.user_info.project_factor;
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
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Existen campos vacíos o incorrectos, favor de revisar.'
            });
        }
    });

    $("#btnEditResolvedForm, #btnEditPrefilledForm").click(function(){
        $.ajax({
            url:'/project/getSettingsForEditing',
            type:'POST',
            data:JSON.stringify({'form_id':me.user_info['form_id'],'user_id':me.user_info['user_id'],'project_id':me.user_info['project_id'],'workspace_id':me.user_info['workspace_id']}),
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
    });

    $("#btnEditPublishingInfo").click(function(){
        $.ajax({
            url:'/project/getPublishingInfo',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    console.log(res.data);
                    $("#FTPresolve_date").val(res.data.resolve_before);
                    $("#FTPcheck_notify_resolved").attr("checked",res.data.notify_resolved);
                    $("#FTPcheck_notify_assignee").attr("checked",res.data.notify_assignee);
                    $.each(res.data.users,function(i,item){
                        if (item.user_id==res.data.assigned_to){
                            $("#FTPassigned_to").append($('<option>',{
                                text:item.name,
                                name:item.user_id,
                                selected:true
                            }));
                        }
                        else{
                            $("#FTPassigned_to").append($('<option>',{
                                text:item.name,
                                name:item.user_id
                            }));
                        }
                    });
                    for (var x in res.data.revisions){
                        //primer revisor (este revisor no puede ser eliminado porque siempre debe haber al menos un revisor)
                        if (x==0){
                            $("#FTPrevision_1").data('currently_assigned',res.data.revisions[x].currently_assigned);
                            $.each(res.data.users,function(i,item){
                                if (res.data.revisions[x].user_id==item.user_id){
                                    $("#FTPrevision_1").append($('<option>',{
                                        text:item.name,
                                        name:item.user_id,
                                        selected:true
                                    }));
                                }
                                else{
                                    $("#FTPrevision_1").append($('<option>',{
                                        text:item.name,
                                        name:item.user_id
                                    }));
                                }
                            });
                            if (res.data.revisions[x].already_revised=='yes'){
                                $("#FTPrevision_1").attr('disabled',true);
                            }
                        }
                        else{
                            //en caso de existir, el resto de los revisores
                            if (res.data.revisions[x].already_revised=='yes'){
                                var disabled=' disabled';
                            }
                            else{
                                var disabled='';
                            }
                            var revision_number=$("#FTPrevisions").children().length+2;
                            $("#FTPrevisions").append('<div class="form-group row" style="padding-top:5px;"><label for="FTPrevision_'+revision_number+'" class="col-sm-3 col-form-label">Revisión '+revision_number+': </label><div class="col-sm-7"><select class="form-control" id="FTPrevision_'+revision_number+'" name="revision_'+revision_number+'" data-revision="'+revision_number+'"'+disabled+'></select></div>');
                            $("#FTPrevision_"+revision_number).data('currently_assigned',res.data.revisions[x].currently_assigned);
                            $.each(res.data.users,function(i,item){
                                if (res.data.revisions[x].user_id==item.user_id){
                                    $("#FTPrevision_"+revision_number).append($('<option>',{
                                        text:item.name,
                                        name:item.user_id,
                                        selected:true
                                    }));
                                }
                                else{
                                    $("#FTPrevision_"+revision_number).append($('<option>',{
                                        text:item.name,
                                        name:item.user_id
                                    }));
                                }
                            });
                        }
                    }
                    // $.each(res.data.users,function(i,item){
                    //     if (res.data.revisions[0].user_id==item.user_id){
                    //         $("#FTPrevision_1").append($('<option>',{
                    //             text:item.name,
                    //             name:item.user_id,
                    //             selected:true
                    //         }));
                    //     }
                    //     else{
                    //         $("#FTPrevision_1").append($('<option>',{
                    //             text:item.name,
                    //             name:item.user_id
                    //         }));
                    //     }
                    // });
                    $("#mod_publish_form").data('mode','edit');
                    $("#btnSeePublishingHistory").css("display","initial");
                    $("#mod_publish_form").modal("show");
                }
                else{
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response
                    });
                }
            }
        });
    });

    $("#btnOpenFolderMenu").click(function(){
        $.ajax({
            url:'/project/getFolderMenuEdit',
            type:'POST',
            data:JSON.stringify({'project_id':me.user_info['project_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $("#div_form_folder_menu").empty();
                    $("#div_form_folder_menu").append(res.menu);
                    $(".file-tree-edit").filetree({
                        animationSpeed: 'fast',
                        collapsed: true
                    });
                    $(".folder-checkbox-edit").on('click',function(e){
                        var folder_id=$(e.target).next().children('a').data('folder');
                        $(".folder-checkbox-edit").prop("checked",false);
                        $(e.target).prop("checked",true);

                    });
                    $("#mod_form_folder_menu").modal("show");
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
    });

    $("#btnEFSAddColumn").click(function(){
        var col_number=parseInt($("#frmEditColumnsSettings").find("fieldset:last-child").find('input:text')[0].name.split("_")[1])+1;
        var col_cont=parseInt($("#EFScolumns").val())+1;
        $("#EFScolumns").val(col_cont);
        var col_name='col_'+col_number;
        var a=$("#frmEditColumnsSettings").append('<fieldset class="form-fieldset"><legend class="form-fieldset-legend">Columna '+col_number+'</legend><div class="form-group row"><label class="col-sm-2 col-form-label">Nombre: </label><div class="col-sm-10"><input type="text" class="form-control" placeholder="Nombre de la columna" name="'+col_name+'"/></div></div><div class="col-sm-4"><div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="" id="check'+col_name+'" name="check'+col_name+'"><label class="form-check-label" for="check'+col_name+'">Editable</label></div></div></fieldset>');

        $(a).find('.form-control:last').on('focusout',function(){
            var input=$(this);
            if (input[0].value.trim().length>0){ //valida si es diferente de vacio y verifica que no tenga puros espacios vacios
                input.removeClass("invalid-field").addClass("valid-field");
            }
            else{
                input.removeClass("valid-field").addClass("invalid-field");
            }
        });
    });

    $("#btnEFSRemoveColumn").click(function(){
        if ($("#frmEditColumnsSettings").find("fieldset:last-child").hasClass('original-column')){
            $.confirm({
                theme:'dark',
                title:'Atención',
                content:'Al eliminar una columna que ya se encuentra en el formulario, también será <b>ELIMINADA LA INFORMACIÓN</b> contenida en dicha columna, ¿deseas continuar?',
                buttons:{
                    confirm:{
                        text:'Sí',
                        action:function(){
                            if (parseInt($("#EFScolumns").val())>0){ //valida que no se pueda poner menos de cero en columnas
                                var col_number=parseInt($("#EFScolumns").val())-1;
                                $("#EFScolumns").val(col_number);
                                $("#frmEditColumnsSettings").find("fieldset:last-child").remove();
                            }
                        }
                    },
                    cancel:{
                        text:'No'
                    }
                }
            });
        }
        else{
            if (parseInt($("#EFScolumns").val())>0){ //valida que no se pueda poner menos de cero en columnas
                var col_number=parseInt($("#EFScolumns").val())-1;
                $("#EFScolumns").val(col_number);
                $("#frmEditColumnsSettings").find("fieldset:last-child").remove();
            }
        }
    });

    $("#btnSelectNewFolder").click(function(){
        if($(".file-tree-edit").find(".folder-checkbox-edit:checked").length==1){
            $("#EFSfolder").val($(".file-tree-edit").find(".folder-checkbox-edit:checked").next('li').children('a')[0].textContent);
            $("#mod_edit_form_settings").data('folder_id',$(".file-tree-edit").find('input:checked').next('li').children('a').data('folder'));
            $("#mod_form_folder_menu").modal("hide");
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debes seleccionar una carpeta'
            });
        }
    });

    $("#frmEditFormSettings .form-control").focusout(function(){
        var id="#"+this.id;
        var error_id="#err"+this.id;
        emptyField(id,error_id);
    });

    $("#frmEditColumnsSettings .form-control").focusout(function(){
        var input=$(this);
        if (input[0].value.trim().length>0){ //valida si es diferente de vacio y verifica que no tenga puros espacios vacios
            input.removeClass("invalid-field").addClass("valid-field");
        }
        else{
            input.removeClass("valid-field").addClass("invalid-field");
        }
    });

    $("#btnSaveEditFormSettings").click(function(){
        $("#frmEditFormSettings :input").focusout();
        $("#frmEditColumnsSettings .form-control").focusout();
        var form_input=$("#frmEditFormSettings .form-control");
        var valid=true;
        for (var x in form_input){
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
                break
            }
        }
        var form_columns=$("#frmEditColumnsSettings .form-control");
        var form_checks=$("#frmEditColumnsSettings .custom-control-input");
        var col_valid=true;
        for (var y in form_columns){
            if (form_columns[y].type=='text'){
                if ($(form_columns[y]).hasClass('invalid-field')){
                    col_valid=false;
                    break
                }
            }
        }
        if (valid===true && col_valid){
            var data=getForm("#frmEditFormSettings");
            if (parseInt(data['rows'])>0){
                if (parseInt(data['columns_number'])>0){
                    data['user_id']=me.user_info['user_id'];
                    if (window.location.pathname.includes('/my-projects')){
                        data['project_id']=$("#aHomeMP").data('projectid');
                        data['form_id']=$(".checkbox-form-menu:checked").data('document');
                    }
                    else{
                        data['project_id']=me.user_info['project_id'];
                        data['form_id']=me.user_info['form_id'];
                    }

                    data['folder_id']=$("#mod_edit_form_settings").data('folder_id');
                    var form_2=getColumnsForm("#frmEditColumnsSettings",null,true);
                    data['columns_info']=form_2;

                    EasyLoading.show({
                        text:'Cargando...',
                        type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                    });
                    $.ajax({
                        url:'/project/saveEditFormSettings',
                        type:'POST',
                        data:JSON.stringify(data),
                        success:function(response){
                            try{
                                var res=JSON.parse(response)
                            }catch(err){
                                ajaxError();
                            }
                            EasyLoading.hide();
                            if (res.success){
                                $.alert({
                                    theme:'dark',
                                    title:'Atención',
                                    content:res.msg_response,
                                    buttons:{
                                        confirm:{
                                            text:'Aceptar',
                                            action:function(){
                                                if (window.location.pathname.includes('/my-projects')){
                                                    if ($("#div-include-fmp").children().length==0){
                                                        getFirstMenuFolders($("#aHomeMP").data('projectid'));
                                                    }
                                                    else{
                                                        getSubfoldersForms($("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder'),$("#aHomeMP").data('projectid'));
                                                    }
                                                    $("#mod_edit_form_settings").modal("hide");
                                                }
                                                else{
                                                    window.location.reload();
                                                }

                                            }
                                        }
                                    }
                                });
                            }
                            else{
                                $.alert({
                                    theme:'dark',
                                    title:'Error',
                                    content:res.msg_response
                                });
                            }
                        }
                    });
                }
            }
        }
    });

    $("#btnDeletePrefilledForm").click(function(){
        $.confirm({
            theme:'dark',
            title:'Atención',
            content:'¿Estás seguro que deseas eliminar el formulario?',
            buttons:{
                confirm:{
                    text:'Sí',
                    action:function(){
                        EasyLoading.show({
                            text:'Cargando...',
                            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                        });
                        $.ajax({
                            url:'/project/deletePrefilledForm',
                            type:'POST',
                            data:JSON.stringify({'form_id':me.user_info['form_id'],'user_id':me.user_info['user_id'],'project_id':me.user_info['project_id']}),
                            success:function(response){
                                EasyLoading.hide();
                                try{
                                    var res=JSON.parse(response);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res.success){
                                    window.location.pathname='/project/'+me.user_info.project_factor;
                                }
                                else {
                                    $.alert({
                                        theme:'dark',
                                        title:'Error',
                                        content:res.msg_response
                                    });
                                }
                            },
                            error:function(){
                                EasyLoading.hide();
                                $.alert({
                                    theme:'dark',
                                    title:'Error',
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
    });

    $("#btnSelectFormFromProject").click(function(){
        $("#mod_sel_form_to_clone").modal("show");
    });

    $("#mod_sel_form_to_clone").on('show.bs.modal',function(){
        $("#SFTCpanelFormMenu").empty();
        $.ajax({
            url:'/project/getProjects',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'filters':''}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $("#SFTCclone_form_project").empty();
                    $.each(res.data,function(i,item){
                        $("#SFTCclone_form_project").append($('<option>',{
                            text:item.name,
                            name:item.project_id
                        }));
                    });
                    $("#SFTCclone_form_project").append($('<option>',{
                        text:'---',
                        name:-1,
                        selected:true
                    }));
                }
            }
        })
    });

    $("#SFTCclone_form_project").on('change',function(){
        $.ajax({
            url:'/project/getMenuForms',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'project_id':$(this).find("option:selected").attr("name")}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $("#SFTCpanelFormMenu").empty();
                    $("#SFTCpanelFormMenu").append(res.menu);
                    $(".file-tree").filetree({
                        animationSpeed: 'fast',
                        collapsed: true
                    });
                    $(".form-checkbox-cloned").on('click',function(e){
                        $(".form-checkbox-cloned").prop("checked",false);
                        $(e.target).prop("checked",true);
                    });
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
    });

    $("#btnSelectFormToCloneAnPr").click(function(){
        if ($(".form-checkbox-cloned:checked").next().children('a').length==1){
            $("#oldClonedFormAnPr").val($(".form-checkbox-cloned:checked").next().children('a')[0].textContent);
            $("#oldClonedFormAnPr").data('old_form_id',$(".form-checkbox-cloned:checked").next().children('a')[0].id);
            $("#oldProjectAnPr").val($("#SFTCclone_form_project").find("option:selected")[0].textContent);
            $("#oldProjectAnPr").data('project_id',$("#SFTCclone_form_project").find("option:selected").attr("name"));
            $("#mod_sel_form_to_clone").modal("hide");
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debes seleccionar un formulario.'
            });
        }
    });

    $("#btnCreateClonedFormAnPr").click(function(){
        $("#frmCloneFormAnPr .form-control").focusout();
        var form_input=$("#frmCloneFormAnPr .form-control");
        var valid=true;
        for (var x in form_input){
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
                break
            }
        }
        if (valid){
            $("#btnCreateClonedFormAnPr").prop("disabled",true);
            var data={};
            data['old_form_id']=$("#oldClonedFormAnPr").data('old_form_id');
            data['old_project_id']=$("#oldProjectAnPr").data('project_id');
            data['form_name']=$("#clonedFormNameAnPr").val();
            data['folder_id']=$("#clonedFormFolderAnPr").data('folder_id');
            data['project_id']=me.user_info['project_id'];
            data['user_id']=me.user_info['user_id'];

            $.ajax({
                url:'/project/cloneFormAnotherProject',
                type:'POST',
                data:JSON.stringify(data),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response,
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        window.location.pathname='/project/'+me.user_info.project_factor;
                                    }
                                }
                            }
                        });
                    }
                    else{
                        $("#btnCreateClonedFormAnPr").prop("disabled",false);
                        $.alert({
                            theme:'dark',
                            title:'Error',
                            content:res.msg_response
                        });
                    }
                },
                error:function(){
                    $("#btnCreateClonedFormAnPr").prop("disabled",false);
                    $.alert({
                        theme:'dark',
                        title:'Error',
                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                    });
                }
            });
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Existen campos vacíos o incompletos.'
            });
        }
    });

    $("#frmCloneFormAnPr .form-control").focusout(function(){
        var id="#"+this.id;
        var error_id="#err"+this.id;
        emptyField(id,error_id);
    });

    $("#btnSeePublishingHistory").click(function(){
        $("#mod_publishing_history").modal("show");
        EasyLoading.show({
            text:'Cargando...',
            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
        });
        $.ajax({
            url:'/project/getPublishingHistory',
            method:'POST',
            data:JSON.stringify({'form_id':me.user_info.form_id,'user_id':me.user_info.user_id}),
            success:function(response){
                EasyLoading.hide();
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    for (var x of res.data){
                        $("#divPublishingHistory").append('<div class="div-form-comment"><p class="comment-content">'+x['html']+'</p><span class="comment-author"> Modificado por:'+x['author']+'</span></div>');
                    }

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
    });

    $("#mod_publishing_history").on('hidden.bs.modal',function(){
        $("#divPublishingHistory").empty();
    });

    $("#btnCollapseObsDoc").click(function(){
        if ($("#btnCollapseObsDoc").hasClass('pin-right')){
            $("#btnCollapseObsDoc").removeClass('pin-right');
            $("#divRSobs_doc").removeClass('col-sm-1').addClass('col-sm-3');
            $("#divRStable").removeClass('col-sm-11').addClass('col-sm-9');
        }
        else{
            $("#btnCollapseObsDoc").addClass('pin-right');
            $("#divRSobs_doc").removeClass('col-sm-3').addClass('col-sm-1');
            $("#divRStable").removeClass('col-sm-9').addClass('col-sm-11');
        }
    });

    $("#btnAddObservation").on('click',function(){
        $(this).attr("disabled",true);
        $("#divFormObs").css("height","95%");
        $(".obs-bg").css("height","60%");

        $("#divEditorAndButtons").append('<div id="comment_editor"></div>');
        $("#divEditorAndButtons").append('<div id="comment_editor_buttons"><button class="btn btn-sm btn-save-obs" data-toggle="tooltip" title="Agregar observación" id="btnSaveNewObs"><i class="fa fa-send"></i></button><button class="btn btn-sm btn-save-obs" data-toggle="tooltip" title="Cancelar" id="btnCancelNewObs"><i class="fa fa-times-circle"></i></button></div>');

        // $(".card-body-obs").append('<div id="comment_editor"></div>');
        // $(".card-body-obs").append('<div class="row-wo-margin justify-content-end" style="display:flex;" id="comment_editor_buttons"><button class="btn btn-sm btn-save-obs" data-toggle="tooltip" title="Cancelar" id="btnCancelNewObs"><i class="fa fa-times-circle"></i></button><button class="btn btn-sm btn-save-obs" data-toggle="tooltip" title="Agregar observación" id="btnSaveNewObs"><i class="fa fa-save"></i></button></div>');

        $("#btnSaveNewObs").click(function(){
            // var data={};
            var data = new FormData();
            // data['comment']=$("#AFMcomment").val().trim();
            var len=quill.getLength();

            // quill.formatText(0,len,{'size':'8px'});
            data.append('comment',$(".ql-editor").html().trim());
            // if (data['comment']!==''){
            if ($(".ql-editor").html().trim()!==''){
                // $("#btnSaveNewObs").prop("disabled",true);



                data.append('user_id',me.user_info['user_id']);
                data.append('form_id',me.user_info['form_id']);
                data.append('project_id',me.user_info['project_id']);
                console.log(data);
                var len=quill.getLength();
                console.log(len);
                quill.formatText(0,len,{'size':'0.9em'});
                EasyLoading.show({
                    text:'Cargando...',
                    type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                });
                $.ajax({
                    url:'/project/addFormComment',
                    type:'POST',
                    // data:JSON.stringify(data),
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
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response
                        });
                        if (res.success){
                            getFormObservations(me.user_info);
                            $("div").remove(".ql-toolbar");
                            $("#comment_editor").remove();
                            $("#comment_editor_buttons").remove();
                            $(".obs-bg").css("height","100%")
                            $("#btnAddObservation").attr("disabled",false);
                            $("#divFormObs").css("height","65%");

                        }
                        else{
                            $("#btnAddObservation").attr("disabled",false);
                            $("#divFormObs").css("height","65%");
                        }
                    },
                    error:function(){
                        EasyLoading.hide();
                        $("#btnAddObservation").attr("disabled",false);
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
                    content:'Debes agregar un comentario.'
                });
            }
        });

        $("#btnCancelNewObs").click(function(){
            $("div").remove(".ql-toolbar");
            $("#comment_editor").remove();
            $("#comment_editor_buttons").remove();
            $(".obs-bg").css("height","100%")
            $("#btnAddObservation").attr("disabled",false);
            $("#divFormObs").css("height","65%");
        });

        // $("#formComments").append('<div id="editor" style="width:100%; height:100px;"></div><button class="btn btn-primary pull-right">Guardar</button>');
        var toolbarOptions=[
            ['bold','italic','underline','strike'],
            [{'list':'ordered'},{'list':'bullet'}],
            [{'color': ['black','red','blue','green','gray'] }, {'background': ['white','yellow','red','blue','green']}],
        ]
        var quill = new Quill('#comment_editor', {
            modules:{
                toolbar:toolbarOptions
            },
            theme: 'snow'
        });

    });

    $("#amodCreateForm").click(function(){
        if ($("#div-include-fmp").children().length==0){
            getFirstMenuFoldersMod($("#aHomeMP").data('projectid'),"#divMPFoldersContMod","#newFormFolder","#div-include-fmp-mod");
            $("#newFormFolder").val("Home");
            $("#newFormFolder").data('folderid',-1);
        }
        else{
            // console.log($("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder'),$("#aHomeMP").data('projectid'))
            getSubfoldersFormsMod($("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder'),$("#aHomeMP").data('projectid'),"#divMPFoldersContMod","#newFormFolder","#div-include-fmp-mod");
            var path_children=$("#div-include-fmp").children('.div-return-menu-subfolder');
            $("#div-include-fmp-mod").addClass('row');
            for (var x of path_children){
                $("#div-include-fmp-mod").append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(x)[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$(x).find('a.return-menu-subfolder').data('folder')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(x)[0].title+'</span></i></a><div>');
            }
            $(".return-menu-subfolder-mod").click(function(e){
                returnSubFolderMod($(e.currentTarget).data('folder'),$("#aHomeMP").data('projectid'),"#divMPFoldersContMod","#newFormFolder","#div-include-fmp-mod");
                $(e.currentTarget).parent('.div-return-menu-subfolder-mod').remove();
            });
            $("#newFormFolder").val($(path_children[path_children.length-1])[0].title);
            $("#newFormFolder").data('folderid',$(path_children[path_children.length-1]).find('a.return-menu-subfolder').data('folder'));
        }

    });


    $("#mod_create_form").on('shown.bs.modal',function(){
        $("#newFormProjectName").html($("#spnMyProjectName").html());
    });

    $("#mod_create_form").on('hidden.bs.modal',function(){
        $("#newFormProjectName").html('');
        $("#divMPFoldersContMod").empty();
        $("#div-include-fmp-mod").empty();
        var columns=$("#frmColumnsSettings").find("fieldset");
        for (var x=columns.length; x>1; x--){
            $("#frmColumnsSettings").find("fieldset:last-child").remove();
        }
        resetForm("#frmCreateformStep1",['input|INPUT']);
    });

    $("#amodCreateFormImport").click(function(){
        if ($("#div-include-fmp").children().length==0){
            getFirstMenuFoldersMod($("#aHomeMP").data('projectid'),"#divMPFoldersContModImport","#newFormImportFolder","#div-include-fmp-mod-import");
            $("#newFormFolder").val("Home");
            $("#newFormFolder").data('folderid',-1);
        }
        else{
            // console.log($("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder'),$("#aHomeMP").data('projectid'))
            getSubfoldersFormsMod($("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder'),$("#aHomeMP").data('projectid'),"#divMPFoldersContModImport","#newFormImportFolder","#div-include-fmp-mod-import");
            var path_children=$("#div-include-fmp").children('.div-return-menu-subfolder');
            // $("#div-include-fmp-mod").addClass('row');
            $("#div-include-fmp-mod-import").addClass('row');
            for (var x of path_children){
                // $("#div-include-fmp-mod").append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(x)[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$(x).find('a.return-menu-subfolder').data('folder')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(x)[0].title+'</span></i></a><div>');
                $("#div-include-fmp-mod-import").append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(x)[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$(x).find('a.return-menu-subfolder').data('folder')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(x)[0].title+'</span></i></a><div>');
            }
            $(".return-menu-subfolder-mod").click(function(e){
                returnSubFolderMod($(e.currentTarget).data('folder'),$("#aHomeMP").data('projectid'),"#divMPFoldersContModImport","#newFormImportFolder","#div-include-fmp-mod-import");
                $(e.currentTarget).parent('.div-return-menu-subfolder-mod').remove();
            });
            // $("#newFormFolder").val($(path_children[path_children.length-1])[0].title);
            // $("#newFormFolder").data('folderid',$(path_children[path_children.length-1]).find('a.return-menu-subfolder').data('folder'));
            $("#newFormImportFolder").val($(path_children[path_children.length-1])[0].title);
            $("#newFormImportFolder").data('folderid',$(path_children[path_children.length-1]).find('a.return-menu-subfolder').data('folder'));
        }
    });

    $("#mod_create_form_import").on('shown.bs.modal',function(){
        $("#newFormImportProjectName").html($("#spnMyProjectName").html());
    });

    $("#mod_create_form_import").on('hidden.bs.modal',function(){
        $("#newFormImportProjectName").html('');
        $("#divMPFoldersContModImport").empty();
        $("#div-include-fmp-mod-import").empty();

        resetForm("#frmCreateformStep1Import",['input|INPUT']);
    });


    $("#amodCreateFormClone").click(function(){
        if ($("#div-include-fmp").children().length==0){
            getFirstMenuFoldersMod($("#aHomeMP").data('projectid'),"#divMPFoldersContModClone","#clonedFormFolder","#div-include-fmp-mod-clone");
            $("#clonedFormFolder").val("Home");
            $("#clonedFormFolder").data('folderid',-1);
        }
        else{
            // console.log($("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder'),$("#aHomeMP").data('projectid'))
            getSubfoldersFormsMod($("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder'),$("#aHomeMP").data('projectid'),"#divMPFoldersContModClone","#clonedFormFolder","#div-include-fmp-mod-clone");
            var path_children=$("#div-include-fmp").children('.div-return-menu-subfolder');
            // $("#div-include-fmp-mod").addClass('row');
            $("#div-include-fmp-mod-clone").addClass('row');
            for (var x of path_children){
                // $("#div-include-fmp-mod").append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(x)[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$(x).find('a.return-menu-subfolder').data('folder')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(x)[0].title+'</span></i></a><div>');
                $("#div-include-fmp-mod-clone").append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(x)[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$(x).find('a.return-menu-subfolder').data('folder')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(x)[0].title+'</span></i></a><div>');
            }
            $(".return-menu-subfolder-mod").click(function(e){
                returnSubFolderMod($(e.currentTarget).data('folder'),$("#aHomeMP").data('projectid'),"#divMPFoldersContModClone","#clonedFormFolder","#div-include-fmp-mod-clone");
                $(e.currentTarget).parent('.div-return-menu-subfolder-mod').remove();
            });
            // $("#newFormFolder").val($(path_children[path_children.length-1])[0].title);
            // $("#newFormFolder").data('folderid',$(path_children[path_children.length-1]).find('a.return-menu-subfolder').data('folder'));
            $("#clonedFormFolder").val($(path_children[path_children.length-1])[0].title);
            $("#clonedFormFolder").data('folderid',$(path_children[path_children.length-1]).find('a.return-menu-subfolder').data('folder'));
        }
    });

    $("#mod_create_form_clone").on('shown.bs.modal',function(){
        $("#newFormClonedProjectName").html($("#spnMyProjectName").html());
    });

    $("#mod_create_form_clone").on('hidden.bs.modal',function(){
        $("#newFormClonedProjectName").html('');
        $("#divMPFoldersContModClone").empty();
        $("#div-include-fmp-mod-clone").empty();

        resetForm("#frmCloneForm",['input|INPUT']);
    });


});


function loadFormTable(form_id,page,user_id){
    var me = this;
    $.ajax({
        url:'/project/createFormTable',
        type:'POST',
        data:JSON.stringify({'form_id':form_id,'page':page,'user_id':user_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#columnSettingsFormName").html(res.form_name);
                $("#columnSettingsLastUpdated").html(res.last_updated);
                $(".p-form-status").html(res.status);
                $("#divColumnsSettings").append(res.html);
                $("#divFormPagingToolbar").append(res.paging_toolbar);
                $("#paging_toolbar_number").val(page);
                $(".form-paging-toolbar").click(function(){
                    $("#divColumnsSettings").empty();
                    $("#divFormPagingToolbar").empty();

                    loadFormTable(form_id,$(this).data('number'),user_id);
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

function loadRevisionUsers(select_id,project_id){
    $.ajax({
        url:'/project/getFormRevisionUsers',
        type:'POST',
        data:JSON.stringify({'project_id':project_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $.each(res.data,function(i,item){
                    $(select_id).append($('<option>',{
                        text:item.name,
                        name:item.user_id,
                        selected:true
                    }));
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
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un error, favor de intentarlo de nuevo.'
            });
        }
    });
}

function getFormToResolve(project_id,form_id,page,user_id){
    $.ajax({
        url:'/project/checkUserIsAllowed',
        type:'POST',
        data:JSON.stringify({'user_id':user_id, 'form_id':form_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                if (res.match===true){
                    $.ajax({
                        url:'/project/getFormToResolve',
                        type:'POST',
                        data:JSON.stringify({'project_id':project_id,'form_id':form_id,'page':page,'user_id':user_id}),
                        success:function(response2){
                            try{
                                var res2=JSON.parse(response2);
                            }catch(err){
                                ajaxError();
                            }
                            if (res2.success){
                                $("#resolveFormName").html(res2.form_name);
                                $("#resolveFormLastUpdated").html(res2.last_updated);
                                $(".p-form-status").html(res2.status);
                                $("#divTableToResolve").append(res2.html);
                                $("#divTableToResolvePagingToolbar").append(res2.paging_toolbar);
                                $("#paging_toolbar_numberTR").val(page);
                                if (res.readonly===true){
                                    $("#grdFormToResolve td").attr('contenteditable','false');
                                }
                                $(".form-paging-toolbar").click(function(){
                                    $("#divTableToResolve").empty();
                                    $("#divTableToResolvePagingToolbar").empty();
                                    getFormToResolve(project_id,form_id,$(this).data('number'),user_id);
                                });

                            }
                            else{
                                $.alert({
                                    theme:'dark',
                                    title:'Atención',
                                    content:res2.msg_response
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
                else{
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response
                    });
                }
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

function saveTableInfo(table_id,url,user_info,show_msg){
    var table_data = $(table_id+" tr").map(function (index, elem) {
        var lista=[];
        var dict={};
        if (index>0){
            $('td',this).each(function(){
                var value=$(this).html().replace(/&nbsp;/gi,'')
                dict[$(this).attr('name')]=value;
                dict['entry_id']=$(this).data('entry');
            });
            lista.push(dict);
        }
        return lista;
    });
    var data={};
    data['table_data']=table_data.get();
    data['form_id']=user_info['form_id'];
    data['project_id']=user_info['project_id'];
    data['user_id']=user_info['user_id'];
    EasyLoading.show({
        text:'Cargando...',
        type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
    });
    $.ajax({
        url:url,
        type:'POST',
        data:JSON.stringify(data),
        success:function(response){
            EasyLoading.hide();
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (show_msg===true){
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


function getColumnsForm(formId,select_list=null,check_list=null){
    var frm = $(formId).serializeArray().reduce(function(obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    var input_list=$(formId).find("fieldset");
    var columns=[];
    for (var x of input_list){
        var name=$(x).find('input:text')[0].name;
        var col_number=String(name.split("_")[1]);
        column={name:$(x).find('input:text')[0].value};
        column['checkcol_'+col_number]=$("#checkcol_"+col_number).prop("checked");
        column['original_'+col_number]=$(x).hasClass('original-column');
        column['order']=col_number;
        if (column['original_'+col_number]==true){
            column['checkdel_'+col_number]=$("#checkdel_"+col_number).prop("checked");
        }
        columns.push(column);

    }
    return columns;
}

function getFormObservations(user_info){
    $.ajax({
        url:'/project/getFormComments',
        type:'POST',
        data:JSON.stringify({'form_id':user_info['form_id'],'user_id':user_info['user_id']}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                //crear divs de comentarioss
                $("#formComments").empty();
                if (res.data.length!=0){
                    for (var x of res.data){
                        // $("#formComments").append('<div class="div-form-comment"><span class="comment-author">'+x['author']+'</span><p class="comment-content">'+x['comment']+'</p></div>');

                        //<div style="font-size: 0.85em; color:#888888;">'+x['edits']+'</div>

                        $("#formComments").append('<div class="div-form-comment"><div class="row-wo-margin row justify-content-between"><div><img width="25px" height="25px" alt="profile" src="/static/images/default-user.png"/><span class="spn-obs-name">'+x['author_name']+'</span><span class="spn-obs-date">'+x['author_date']+'</span></div><div data-id="'+x['comment_id']+'"><button class="btn btn-sm btn-edit-obs"><i class="fa fa-edit"></i></button></div></div><div class="comment-content">'+x['comment']+'</div></div>');

                    }
                    $(".btn-edit-obs").click(function(){
                        // console.log($(this).parents(".div-form-comment"));
                        console.log($(this).parent('div').data('id'));
                        var comment_id=$(this).parent('div').data('id');
                        $("#divFormObs").css("height","95%");
                        $(".obs-bg").css("height","98%"); //en agregar comentario aquí está a 60%, considerar al momento de regresar al tamaño original

                        $('<div class="row row-wo-margin"><div id="comment_editor"></div><div id="comment_editor_buttons"><button class="btn btn-sm btn-save-obs" data-toggle="tooltip" title="Agregar observación" id="btnSaveEditObs"><i class="fa fa-send"></i></button><button class="btn btn-sm btn-save-obs" data-toggle="tooltip" title="Cancelar" id="btnCancelEditObs"><i class="fa fa-times-circle"></i></button></div></div>').insertAfter($(this).parents(".div-form-comment"));

                        // $('<div id="comment_editor_buttons"><button class="btn btn-sm btn-save-obs" data-toggle="tooltip" title="Agregar observación" id="btnSaveEditObs"><i class="fa fa-send"></i></button><button class="btn btn-sm btn-save-obs" data-toggle="tooltip" title="Cancelar" id="btnCancelNewObs"><i class="fa fa-times-circle"></i></button></div>').insertAfter($("#comment_editor"));

                        var toolbarOptions=[
                            ['bold','italic','underline','strike'],
                            [{'list':'ordered'},{'list':'bullet'}],
                            [{'color': ['black','red','blue','green','gray'] }, {'background': ['white','yellow','red','blue','green']}],
                        ]
                        var quill = new Quill('#comment_editor', {
                            modules:{
                                toolbar:toolbarOptions
                            },
                            theme: 'snow'
                        });

                        var text_content=$(this).parents(".div-form-comment").find(".comment-content").html();
                        quill.container.firstChild.innerHTML =text_content;

                        $("#btnSaveEditObs").click(function(){
                            var data = new FormData();
                            var len=quill.getLength();
                            data.append('comment',$(".ql-editor").html().trim());
                            if ($(".ql-editor").html().trim()!==''){
                                data.append('user_id',user_info['user_id']);
                                data.append('form_id',user_info['form_id']);
                                data.append('project_id',user_info['project_id']);
                                data.append('comment_id',comment_id);
                                var len=quill.getLength();
                                quill.formatText(0,len,{'size':'0.9em'});
                                EasyLoading.show({
                                    text:'Cargando...',
                                    type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                                });
                                $.ajax({
                                    url:'/project/editFormComment',
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
                                        $.alert({
                                            theme:'dark',
                                            title:'Atención',
                                            content:res.msg_response
                                        });
                                        if (res.success){
                                            getFormObservations(user_info);
                                            $("div").remove(".ql-toolbar");
                                            $("#comment_editor").remove();
                                            $("#comment_editor_buttons").remove();
                                            $(".obs-bg").css("height","100%")
                                            $("#btnAddObservation").attr("disabled",false);
                                            $("#divFormObs").css("height","65%");

                                        }
                                        else{
                                            $("#btnAddObservation").attr("disabled",false);
                                            $("#divFormObs").css("height","65%");
                                        }
                                    },
                                    error:function(){
                                        EasyLoading.hide();
                                        $("#btnAddObservation").attr("disabled",false);
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
                                    content:'Debes agregar un comentario.'
                                });
                            }
                        });
                        $("#btnCancelEditObs").click(function(){
                            $("div").remove(".ql-toolbar");
                            $("#comment_editor").remove();
                            $("#comment_editor_buttons").remove();
                            $(".obs-bg").css("height","100%")
                            $("#btnAddObservation").attr("disabled",false);
                            $("#divFormObs").css("height","65%");
                        });

                    });


                }
                else{
                    $("#formComments").append('<div class="comment-content">No ha sido agregada ninguna observación.</div>');
                }

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

function getFormDocuments(user_info){
    $.ajax({
        url:'/project/getFormDocuments',
        type:'POST',
        data:JSON.stringify({'user_id':user_info['user_id'],'form_id':user_info['form_id'],'project_id':user_info['project_id']}),
        success:function(response2){
            try{
                var res2=JSON.parse(response2);
            }catch(err){
                ajaxError();
            }
            if (res2.success){
                $("#formDocuments").empty();
                $("#formDocuments").append(res2.data);
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:res2.msg_response
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

function getFormPath(user_info){
    $.ajax({
        url:'/project/getFormPath',
        type:'POST',
        data:JSON.stringify({'form_id':user_info['form_id'],'user_id':user_info['user_id'],'project_id':user_info['project_id']}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                console.log(res['data']);
                $("#div-include-fmp").empty();
                var data_len=res.data.length;
                console.log(data_len);
                for (var x=data_len-1; x>=0; x--){
                    console.log(res.data[x]);
                    if (x==0){
                        $("#div-include-fmp").append('<i class="fa fa-folder-open last-icon-form-path"><span class="spn-form-menu-path">'+res.data[x]+'</span></i>');
                    }
                    else{
                        $("#div-include-fmp").append('<i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+res.data[x]+'</span></i><i class="fa fa-angle-right icon-form-path"></i>');
                    }

                }
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
