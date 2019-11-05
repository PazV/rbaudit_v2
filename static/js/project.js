$(document).ready(function(){
    var me = this;

    var today=new Date().toISOString().split("T")[0];
    var split_date=today.split("-");
    split_date[2]="01";
    var first_day=split_date.join("-");
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    loadProjects(me.user_info); //carga de inicio los proyectos

    var location=window.location.pathname;
    if (location.split('/')[1]=='project'){
        loadFormPanel(me.user_info,location);
        loadTreeMenu(me.user_info['project_id']);
        loadFormsToCheck(me.user_info,location);
        $("#btnOpenNotifications").css("visibility","visible");
    }

    if (window.location.pathname.includes('/home/') || (window.location.pathname.includes('/notifications/'))){
        $("#topnb_leftmenu").css("visibility","hidden");
        if (window.location.pathname.includes('/home/')){
            $("#btnOpenNotifications").css("visibility","hidden");
        }
        else{
            $("#btnOpenNotifications").css("visibility","visible");
        }
    }
    else{
        $("#topnb_leftmenu").css("visibility","visible");
    }

    $("#mod_new_project").on('show.bs.modal',function(){
        $("#NPdateFrom").val(first_day);
        $("#NPdateTo").val(today);
        $.ajax({
            url:'/users/getUserList',
            type:'POST',
            data:JSON.stringify({'workspace_id':me.user_info['workspace_id'],'user_id':me.user_info['user_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $.each(res.data,function(i,item){
                        $("#NPmanager").append($('<option>',{
                            text:item.name,
                            name:item.user_id,
                            selected:true
                        }));
                    });
                    $.each(res.data,function(i,item){
                        $("#NPpartner").append($('<option>',{
                            text:item.name,
                            name:item.user_id,
                            selected:true
                        }));
                    });
                }
            }
        })
    });

    $("#mod_new_project").on('hidden.bs.modal',function(){
        resetForm("#frmNewProject",["input|INPUT","select|SELECT","textarea|TEXTAREA"]);
    });

    $("#btnSaveProject").click(function(){
        $("#frmNewProject :input").focusout();
        var form_input=$("#frmNewProject .form-control");
        var valid=true;
        for (var x in form_input){
            console.log(form_input[x].id);
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
            }
        }
        if (valid===true){
            var data=getForm('#frmNewProject',[{'id':'#NPpartner','name':'partner'},{'id':'#NPmanager','name':'manager'}]);
            data['created_by']=me.user_info['user_id'];
            data['project_id']=-1;
            data['user_id']=me.user_info['user_id'];
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/saveProject',
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
                                    text:'Ok',
                                    action:function(){
                                        $("#mod_new_project").modal("hide");
                                        loadProjects(me.user_info);
                                        //mandar a llamar función que vuelva a cargar el div de proyectos
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
                },
                failure:function(){
                    EasyLoading.hide();
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                    });
                }
            })
        }

    });

    $("#frmNewProject .form-control").focusout(function(){
        if (this.id!=='NPcomments'){
            var id="#"+this.id;
            var error_id="#err"+this.id;
            emptyField(id,error_id);
        }
    });

    $("#btnCollapseUnpublishedPanel").click(function(){
        if ($("#ibtnCollapseUnpublishedPanel").hasClass('unpublished-pin-collapsed')){
            $("#ibtnCollapseUnpublishedPanel").removeClass('unpublished-pin-collapsed');
            $($("#bodyContent").children().children()[2]).addClass('col-sm-3');
            $($("#bodyContent").children().children()[2]).css("max-width","");
            $($("#bodyContent").children().children()[1]).css("width","");
            $($("#bodyContent").children().children()[1]).css("max-width","");
            if ($("#divCollapseTreepanel").is(':visible')){
                $($("#bodyContent").children().children()[1]).addClass('col-sm-6');
            }
            else{
                $($("#bodyContent").children().children()[1]).css("max-width","70%");
                $($("#bodyContent").children().children()[1]).css("width","100%");
            }
        }
        else{
            $("#ibtnCollapseUnpublishedPanel").addClass('unpublished-pin-collapsed');
            $($("#bodyContent").children().children()[2]).removeClass('col-sm-3');
            $($("#bodyContent").children().children()[2]).css("max-width","5%");
            $($("#bodyContent").children().children()[1]).removeClass('col-sm-6');
            $($("#bodyContent").children().children()[1]).css("width","100%");
            if ($("#divCollapseTreepanel").is(':visible')){
                $($("#bodyContent").children().children()[1]).css("max-width","70%");
            }
            else{
                $($("#bodyContent").children().children()[1]).css("max-width","90%");
            }
        }
    });

    $("#mod_clone_project").on('show.bs.modal',function(){
        $("#ClPdateFrom").val(first_day);
        $("#ClPdateTo").val(today);
        $.ajax({
            url:'/project/getAvailableProjects',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id']}),
                success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $.each(res.data,function(i,item){
                        $("#ClPcloned_from").append($('<option>',{
                            text:item.name,
                            name:item.project_id,
                            selected:true
                        }));
                    });
                    $.ajax({
                        url:'/users/getUserList',
                        type:'POST',
                        data:JSON.stringify({'workspace_id':me.user_info['workspace_id'],'user_id':me.user_info['user_id']}),
                        success:function(response2){
                            try{
                                var res2=JSON.parse(response2);
                            }catch(err){
                                ajaxError();
                            }
                            if (res2.success){
                                $.each(res2.data,function(i,item){
                                    $("#ClPmanager").append($('<option>',{
                                        text:item.name,
                                        name:item.user_id,
                                        selected:true
                                    }));
                                });
                                $.each(res2.data,function(i,item){
                                    $("#ClPpartner").append($('<option>',{
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

    $("#mod_clone_project").on('hide.bs.modal',function(){
        resetForm("#frmCloneProject",["input|INPUT","select|SELECT","textarea|TEXTAREA"]);
    });

    $("#btnSaveClonedProject").click(function(){
        $("#frmCloneProject :input").focusout();
        var form_input=$("#frmCloneProject .form-control");
        var valid=true;
        for (var x in form_input){
            console.log(form_input[x].id);
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
            }
        }
        if (valid===true){
            var data=getForm('#frmCloneProject',[{'id':'#ClPpartner','name':'partner'},{'id':'#ClPmanager','name':'manager'},{'id':'#ClPcloned_from','name':'cloned_project'}]);
            data['created_by']=me.user_info['user_id'];
            data['project_id']=-1;
            data['user_id']=me.user_info['user_id'];
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            console.log(data);
            $.ajax({
                url:'/project/saveClonedProject',
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
                                    text:'Ok',
                                    action:function(){
                                        $("#mod_clone_project").modal("hide");
                                        loadProjects(me.user_info);
                                    }
                                }
                            }
                        })
                    }
                    else{
                        $.alert({
                            theme:'dark',
                            title:'ERROR',
                            content:res.msg_response
                        });
                    }
                },
                failure:function(){
                    EasyLoading.hide();
                    $.alert({
                        theme:'dark',
                        title:'ERROR',
                        content:'Ocurrió un error, favor de intentarlo de nuevo.'
                    });
                }
            });
        }
    });

    $("#frmCloneProject .form-control").focusout(function(){
        if (this.id!=='ClPcomments'){
            var id="#"+this.id;
            var error_id="#err"+this.id;
            emptyField(id,error_id);
        }
    });

    $("#mod_delete_project").on('show.bs.modal',function(){
        $.ajax({
            url:'/project/permissionDeleteProject',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    if (res.allowed==false){
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response,
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        $("#mod_delete_project").modal("hide");
                                    }
                                }
                            }
                        });
                    }
                    else{
                        $.ajax({
                            url:'/project/getProjects',
                            type:'POST',
                            data:JSON.stringify({'user_id':me.user_info['user_id']}),
                            success:function(response){
                                try{
                                    var res=JSON.parse(response);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res.success){
                                    $("#DelPprojects").empty();
                                    $.each(res.data,function(i,item){
                                        $("#DelPprojects").append($('<option>',{
                                            text:item.name,
                                            name:item.project_id,
                                            selected:true
                                        }));
                                    });
                                }
                            }
                        });
                    }
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
                    title:'Atención',
                    content:'Ocurrió un error, favor de intentarlo de nuevo.'
                });
            }
        });
    });

    $("#btnShowProjectDetails").click(function(){
        $("#mod_project_info").modal("show");
        $.ajax({
            url:'/project/getProjectInfo',
            type:'POST',
            data:JSON.stringify({'project_id':$("#DelPprojects").find("option:selected").attr("name")}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $("#cardproj_info_header").html("");
                    $("#cardproj_info_body").html("");
                    $("#mod_project_info").modal("show");
                    $("#cardproj_info_header").html(res.project_name);
                    $("#cardproj_info_body").html(res.project_info);
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
                    title:'Atención',
                    content:'Ocurrió un error, favor de intentarlo de nuevo.'
                });
            }
        });
    });

    $("#btnDeleteProject").click(function(){
        $.confirm({
            theme:'dark',
            title:'Atención',
            content:'¿Estás seguro de querer eliminar el proyecto '+$("#DelPprojects").val()+'?, una vez realizada esta acción no podrá ser revertida.',
            buttons:{
                confirm:{
                    text:'Sí',
                    action:function(){
                        EasyLoading.show({
                            text:'Cargando...',
                            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                        });
                        $.ajax({
                            url:'/project/deleteProject',
                            type:'POST',
                            data:JSON.stringify({'user_id':me.user_info['user_id'],'project_id':$("#DelPprojects").find("option:selected").attr("name")}),
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
                                                    window.location.reload();
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
        })
    });

});

function loadProjects(user_info){
    $.ajax({
        url:'/project/getProjects',
        type:'POST',
        data:JSON.stringify({'user_id':user_info['user_id']}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#projectListContainer ul").children().remove();
                $.each(res.data,function(i,item){
                    $("#projectListContainer ul").append('<li class="proj-list-li"><a class="proj-list-a" href="/project/'+item.project_factor+'" name="'+item.project_id+'">'+item.name+'</a></li>');
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

function loadFormPanel(user_info,location){
    var me = this;
    $.ajax({
        url:'/project/checkRightPanelPermission',
        type:'POST',
        data:JSON.stringify({'user_id':user_info['user_id']}),
        success:function(first_response){
            try{
                var first_res=JSON.parse(first_response);
            }catch(err){
                ajaxError();
            }
            if (first_res.success){
                if (first_res.allowed){
                    var url=location+'/getUnpublishedForms';
                    $.ajax({
                        url:url,
                        type:'POST',
                        data:JSON.stringify({'project_id':user_info.project_id,'user_id':user_info.user_id}),
                        success:function(response){
                            try{
                                var res=JSON.parse(response);
                            }catch(err){
                                ajaxError();
                            }
                            if (res.success){
                                $("#divFormPanel ul").children().remove();
                                $.each(res.data,function(i,item){
                                    url='/project/'+user_info['project_factor']+'/createform/step-2/'+item['form_id'];
                                    $("#divFormPanel ul").append('<li class="unpublished-form-li"><a class="unpublished-form-a" href="'+url+'" data-toggle="tooltip" title="'+item.name+'">'+item.name+'</a></li>')
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
                                content:'Ocurrió un error, favor de intentarlo de nuevo más tarde.'
                            });
                        }
                    });
                }
                else{
                    $("#unpublished_panel").collapse("toggle");
                    $("#ibtnCollapseUnpublishedPanel").addClass('unpublished-pin-collapsed');
                    $($("#bodyContent").children().children()[2]).removeClass('col-sm-3');
                    $($("#bodyContent").children().children()[2]).css("max-width","5%");
                    $($("#bodyContent").children().children()[1]).removeClass('col-sm-6');
                    $($("#bodyContent").children().children()[1]).css("width","100%");
                    $($("#bodyContent").children().children()[1]).css("max-width","70%");
                    $("#btnCollapseUnpublishedPanel").css("display","none");
                }
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:first_res.msg_response
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

function loadFormsToCheck(user_info,location){

    var url=location+'/getFormsToCheck';
    $.ajax({
        url:url,
        type:'POST',
        data:JSON.stringify({'project_id':user_info.project_id, 'user_id':user_info.user_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divFormPanelToCheck ul").children().remove();
                $.each(res.data,function(i,item){
                    url='/project/'+user_info['project_factor']+'/'+item['form_id'];
                    $("#divFormPanelToCheck ul").append('<li class="unpublished-form-li"><a class="unpublished-form-a" href="'+url+'" data-toggle="tooltip" title="'+item.name+'">'+item.name+'</a></li>')
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
                content:'Ocurrió un error, favor de intentarlo de nuevo más tarde.'
            });
        }
    });
}
