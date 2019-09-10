$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    if (window.location.pathname.includes('/step-2/')){
        loadFormTable(me.user_info['form_id'],1);
    }

    if (window.location.pathname=='/project/'+me.user_info['project_factor']+'/'+me.user_info['form_id']){
        getFormToResolve(me.user_info['project_id'],me.user_info['form_id'],1,me.user_info['user_id']);

    }

    $("#btnGotoFormStep2").click(function(){
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
                    data['project_id']=me.user_info['project_id'];
                    data['form_id']=-1;
                    data['folder_id']=$(".file-tree").find('.selected').data('folder');
                    console.log(data);
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

                                window.location.pathname='/project/'+me.user_info.project_factor+'/createform/step-2/'+res.form_id;
                                loadFormTable(res.form_id,1);
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
        console.log(me.user_info);
    });

    $("#btnAddColumn").click(function(){
        var col_number=parseInt($("#newFormColumns").val())+1;
        $("#newFormColumns").val(col_number);
        var col_name='col_'+col_number;
        var a=$("#frmColumnsSettings").append('<fieldset class="form-fieldset"><legend class="form-fieldset-legend">Columna '+col_number+'</legend><div class="form-group row"><label class="col-sm-2 col-form-label">Nombre: </label><div class="col-sm-10"><input type="text" class="form-control" placeholder="Nombre de la columna" name="'+col_name+'"/></div></div><div class="col-sm-4"><div class="custom-control custom-checkbox"><input class="custom-control-input" type="checkbox" value="" id="check'+col_name+'" name="check'+col_name+'"><label class="custom-control-label" for="check'+col_name+'">Editable</label></div></div></fieldset>');

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
        $("#mod_publish_form").modal("show");
        loadRevisionUsers("#FTPassigned_to",me.user_info['project_id']);
        loadRevisionUsers("#FTPrevision_1",me.user_info['project_id']);

    });

    $("#mod_publish_form").on('hide.bs.modal',function(){
        resetForm("#frmFormToPublish",['input|INPUT','select|SELECT']);
        $("#FTPrevisions").empty();
    });

    $("#btnFTPaddRevision").click(function(){
        if ($("#FTPrevisions").children().last().length==0){
            $("#FTPrevisions").append('<div class="form-group row" style="padding-top:5px;"><label for="FTPrevision_2" class="col-sm-3 col-form-label">Revisión 2: </label><div class="col-sm-7"><select class="form-control" id="FTPrevision_2" name="revision_2" data-revision="2"></select></div>');
            loadRevisionUsers("#FTPrevision_2",me.user_info['project_id']);
        }
        else{
            var revision_number=$("#FTPrevisions").children().length+2;
            $("#FTPrevisions").append('<div class="form-group row" style="padding-top:5px;"><label for="FTPrevision_'+revision_number+'" class="col-sm-3 col-form-label">Revisión '+revision_number+': </label><div class="col-sm-7"><select class="form-control" id="FTPrevision_'+revision_number+'" name="revision_'+revision_number+'" data-revision="'+revision_number+'"></select></div>');
            loadRevisionUsers("#FTPrevision_"+revision_number,me.user_info['project_id']);
        }
    });

    $("#btnFTPremoveRevision").click(function(){
        $("#FTPrevisions").children().last().remove();
    });

    $("#FTPresolve_date").focusout(function(){
        emptyField("#FTPresolve_date","#errFTPresolve_date");
    });

    $("#btnPFpublishForm").click(function(){
        $("#FTPresolve_date").focusout();
        if ($("#FTPresolve_date").hasClass('valid-field')){
            saveTableInfo("#grdPrefilledForm",'/project/savePrefilledForm',me.user_info,false);
            var sel_list=[{'id':'#FTPassigned_to','name':'assigned_to'},{'id':'#FTPrevision_1','name':'revision_1'}];
            var revisions=$("#FTPrevisions").children();
            for (var x of revisions){
                sel_list.push({'id':'#'+$(x).find('select')[0].id,'name':$(x).find('select')[0].name});
            }
            var data=getForm("#frmFormToPublish",sel_list,true);
            data['project_id']=me.user_info['project_id'];
            data['form_id']=me.user_info['form_id'];
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/publishForm',
                type:'POST',
                data:JSON.stringify(data),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
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
                                        window.location.pathname='/project/'+me.user_info.project_factor;
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
            data:JSON.stringify({'form_id':me.user_info['form_id']}),
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
                                    $.alert({
                                        theme:'dark',
                                        title:'Atención',
                                        content:res.msg_response
                                    })
                                    if (res.success){
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
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:res.msg_response
                    });
                    if (res.success){
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
        $.ajax({
            url:'/project/checkAddComment',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'form_id':me.user_info['form_id']}),
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
        var data={};
        data['comment']=$("#AFMcomment").val().trim();
        if (data['comment']!==''){
            data['user_id']=me.user_info['user_id'];
            data['form_id']=me.user_info['form_id'];
            $.ajax({
                url:'/project/addFormComment',
                type:'POST',
                data:JSON.stringify(data),
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
                        $("#mod_add_form_comment").modal("hide");
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
                content:'Debes agregar un comentario.'
            });
        }
    });

    $("#mod_add_form_comment").on('hide.bs.modal',function(){
        $("#AFMcomment").val("");
    })

    $("#btnFormSeeComments").click(function(){
        $.ajax({
            url:'/project/getFormComments',
            type:'POST',
            data:JSON.stringify({'form_id':me.user_info['form_id']}),
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

    $("#btnImportNewForm").click(function(){
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
            data.append('project_id',me.user_info['project_id']);
            data.append('form_id',-1);
            data.append('folder_id',$(".file-tree").find('.selected').data('folder'));
            data.append('name',$("#newFormImportName").val());
            var file = $("#newFormImportFile")[0].files[0];
            var file_name=$("#newFormImportFile")[0].files[0].name;
            data.append(file_name,file);
            data.append('file_name',file_name);
            $.ajax({
                url:'/project/importNewForm',
                type:'POST',
                processData:false,
                contentType:false,
                data:data,
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        window.location.pathname='/project/'+me.user_info.project_factor;
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
                            data:JSON.stringify({'form_id':me.user_info['form_id'],'project_id':me.user_info['project_id']}),
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
    });

    $("#UFFzip_file").on('change',function(){
        var path=$("#UFFzip_file")[0].value.split("\\").pop();
        $("#UFFzip_file").siblings("label").html(path);
        var pattern=$("#UFFzip_file")[0].pattern.split(",");
        if (hasExtension("UFFzip_file",pattern)){
            $("#UFFzip_file").parent('.custom-file').addClass('valid-file-field').removeClass('invalid-file-field');
            $("#errUFFzip_file").removeClass('show-error-msg').addClass('hide-error-msg');
        }
        else{
            $("#UFFzip_file").parent('.custom-file').removeClass('valid-file-field').addClass('invalid-file-field');
            $("#errUFFzip_file").html("Formato incorrecto");
            $("#errUFFzip_file").addClass('show-error-msg').removeClass('hide-error-msg');
        }
        this.blur();
    });

    $("#btnUploadZip").click(function(){
        if ($("#UFFzip_file")[0].files.length==1){
            if ($("#UFFzip_file").parent('.custom-file').hasClass('valid-file-field')){
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
                            url:'/project/getZipDownloadLink',
                            type:'POST',
                            data:JSON.stringify({'form_id':me.user_info['form_id'],'project_id':me.user_info['project_id']}),
                            success:function(response2){
                                try{
                                    var res2=JSON.parse(response2);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res2.success){
                                    if (res2.has_file){
                                        $.alert({
                                            theme:'dark',
                                            title:'Atención',
                                            content:res2.msg_response,
                                            buttons:{
                                                confirm:{
                                                    text:'Descargar',
                                                    action:function(){
                                                        window.open(res2.file,"_blank");
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

});


function loadFormTable(form_id,page){
    var me = this;
    $.ajax({
        url:'/project/createFormTable',
        type:'POST',
        data:JSON.stringify({'form_id':form_id,'page':page}),
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
                    // console.log($(this).data('number'));
                    loadFormTable(form_id,$(this).data('number'));
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
