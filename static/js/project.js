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

    if (window.location.pathname.includes('/home/') ||  (window.location.pathname.includes('/notifications/'))){
        $("#topnb_leftmenu").css("visibility","hidden");
        if (me.user_info.consultant===true){
            $("#consultant_home").css("display","initial");
        }
        else{
            $("#consultant_home").css("display","none");
        }
        if (window.location.pathname.includes('/home/')){
            $("#btnOpenNotifications").css("visibility","hidden");
            if (me.user_info.consultant===true){
                $(".consultant-li").removeClass("consultant-li-hide").addClass("consultant-li-show");
            }
            else{
                $(".consultant-li").removeClass("consultant-li-show").addClass("consultant-li-hide");
            }
            if (window.location.pathname.includes('/home/consultant')){
                $(".consultant-li").removeClass("consultant-li-hide").addClass("consultant-li-show");
                getConsultantWorkspaces(me.user_info,true);
            }
        }
        else{
            $("#btnOpenNotifications").css("visibility","visible");
        }
    }
    else{
        $("#topnb_leftmenu").css("visibility","visible");
        if (me.user_info.consultant===true){
            $("#consultant_home").css("display","initial");
        }
        else{
            $("#consultant_home").css("display","none");
        }
    }

    $("#mod_new_project").on('show.bs.modal',function(){

        $("#NPdateFrom").val(first_day);
        $("#NPdateTo").val(today);
        var workspace_id;

        if (window.location.pathname=='/home/'){

            workspace_id=me.user_info['workspace_id'];
        }
        else{

            if (me.user_info['consultant']===true){
                workspace_id=$("#consultant_workspaces").find("option:selected").attr("name");
            }
            else{
                workspace_id=me.user_info['workspace_id'];
            }
        }

        $.ajax({
            url:'/users/getUserList',
            type:'POST',
            data:JSON.stringify({'workspace_id':workspace_id,'user_id':me.user_info['user_id'],'project_factor':-1}),
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
        var include_creator; //variable para identificar si se creó desde el espacio de trabajo propio o si se creó como consultor, para no agregarlo en la lista de usuarios del proyecto
        if (window.location.pathname=='/home/'){
            var ws=me.user_info['workspace_id'];
            include_creator=true; //cuando se crea desde el espacio de trabajo propio, se incluye al usuario en los usuarios del proyecto
        }
        else{
            var ws=$("#consultant_workspaces").find("option:selected").attr("name");
            include_creator=false; //cuando se crea desde otro espacio de trabajo (como consultor), no se incluye al usuario en los usuarios del proyecto
        }

        $("#frmNewProject :input").focusout();
        var form_input=$("#frmNewProject .form-control");
        var valid=true;
        for (var x in form_input){
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
            }
        }
        if (valid===true){
            var data=getForm('#frmNewProject',[{'id':'#NPpartner','name':'partner'},{'id':'#NPmanager','name':'manager'}]);
            data['created_by']=me.user_info['user_id'];
            data['project_id']=-1;
            data['user_id']=me.user_info['user_id'];
            data['include_creator']=include_creator;
            data['workspace_id']=ws;
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
                                        if (window.location.pathname=='/home/'){
                                            loadProjects(me.user_info);
                                        }
                                        else{
                                            getWorkspaceProjects(me.user_info,$("#consultant_workspaces").find("option:selected").attr("name"))
                                        }

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
        if (window.location.pathname.includes('/home/consultant')){
            var workspace_id=$("#consultant_workspaces").find("option:selected").attr("name");
            var consultant_mode=true;
        }
        else{
            var workspace_id=me.user_info['workspace_id'];
            var consultant_mode=false;
        }
        $.ajax({
            url:'/project/getAvailableProjects',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'workspace_id':workspace_id,'consultant_mode':consultant_mode}),
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
                        // data:JSON.stringify({'workspace_id':me.user_info['workspace_id'],'user_id':me.user_info['user_id']}),
                        data:JSON.stringify({'workspace_id':workspace_id,'user_id':me.user_info['user_id'],'project_factor':-1}),
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

            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
            }
        }
        if (valid===true){
            if (window.location.pathname=='/home/'){
                var ws=me.user_info['workspace_id'];
            }
            else{
                var ws=$("#consultant_workspaces").find("option:selected").attr("name");
            }
            var data=getForm('#frmCloneProject',[{'id':'#ClPpartner','name':'partner'},{'id':'#ClPmanager','name':'manager'},{'id':'#ClPcloned_from','name':'cloned_project'}]);
            data['created_by']=me.user_info['user_id'];
            data['project_id']=-1;
            data['user_id']=me.user_info['user_id'];
            data['workspace_id']=ws;
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });

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
                                        if (window.location.pathname=='/home/'){
                                            loadProjects(me.user_info);
                                        }
                                        else{
                                            getWorkspaceProjects(me.user_info,$("#consultant_workspaces").find("option:selected").attr("name"))
                                        }
                                        // loadProjects(me.user_info);
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
        if (window.location.pathname=='/home/'){
            var ws=me.user_info['workspace_id'];
        }
        else{
            var ws=$("#consultant_workspaces").find("option:selected").attr("name");
        }
        $.ajax({
            url:'/project/permissionDeleteProject',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info['user_id'],'workspace_id':ws,'consultant':me.user_info.consultant}),
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
                        if (window.location.pathname=='/home/'){
                            var ws=me.user_info['workspace_id'];
                            var url='/project/getProjects';
                            var aj_data={'user_id':me.user_info['user_id']};
                        }
                        else{
                            var ws=$("#consultant_workspaces").find("option:selected").attr("name");
                            var url='/project/getConsultantProjects';
                            var aj_data={'user_id':me.user_info['user_id'],'workspace_id':ws}
                        }


                        $.ajax({
                            // url:'/project/getProjects',
                            url:url,
                            type:'POST',
                            // data:JSON.stringify({'user_id':me.user_info['user_id']}),
                            data:JSON.stringify(aj_data),
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

    $("#mod_project_form_info").on('hidden.bs.modal',function(){
        $("#grdProjFormInfo").empty();
        $("#grdProjFormInfo").append('<tr><th>Formulario</th><th>Estado</th><th>.</th></tr>');
    });

    $("#mod_edit_project_info").on('show.bs.modal',function(){
        $.ajax({
            url:'/project/getProjectEditInfo',
            type:'POST',
            data:JSON.stringify({'project_id':me.user_info['project_id'],'user_id':me.user_info['user_id']}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    if (res.allowed){
                        $.each(res.users,function(i,item){
                            if (item.user_id==res.project_info.manager){
                                $("#EPImanager").append($('<option>',{
                                    text:item.name,
                                    name:item.user_id,
                                    selected:true
                                }));
                            }
                            else{
                                $("#EPImanager").append($('<option>',{
                                    text:item.name,
                                    name:item.user_id
                                }));
                            }
                        });
                        $.each(res.users,function(i,item){
                            if (item.user_id==res.project_info.partner){
                                $("#EPIpartner").append($('<option>',{
                                    text:item.name,
                                    name:item.user_id,
                                    selected:true
                                }));
                            }
                            else{
                                $("#EPIpartner").append($('<option>',{
                                    text:item.name,
                                    name:item.user_id
                                }));
                            }
                        });
                        $("#EPIdateFrom").val(res.project_info.start_date);
                        $("#EPIdateTo").val(res.project_info.finish_date);
                        $("#EPIcompany_name").val(res.project_info.company_name);
                        $("#EPIproject_name").val(res.project_info.name);
                        $("#EPIcomments").val(res.project_info.comments);
                    }
                    else{
                        $.alert({
                            theme:'dark',
                            title:'Atención',
                            content:res.msg_response,
                            buttons:{
                                confirm:{
                                    text:'Aceptar',
                                    action:function(){
                                        $("#mod_edit_project_info").modal("hide");
                                    }
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
                    title:'Error',
                    content:'Ocurrió un error, favor de intentarlo de nuevo.'
                });
            }
        });
    });

    $("#btnSaveProjectInfo").click(function(){
        $("#frmEditProjectInfo :input").focusout();
        var form_input=$("#frmEditProjectInfo .form-control");
        var valid=true;
        for (var x in form_input){
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
            }
        }
        if (valid===true){
            var data=getForm('#frmEditProjectInfo',[{'id':'#EPIpartner','name':'partner'},{'id':'#EPImanager','name':'manager'}]);
            data['project_id']=me.user_info['project_id'];
            data['user_id']=me.user_info['user_id'];
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/saveEditedProjectInfo',
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
                                        $("#mod_edit_project_info").modal("hide");
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
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Existen campos vacíos o incompletos.'
            });
        }
    });

    $("#frmEditProjectInfo .form-control").focusout(function(){
        if (this.id!=='EPIcomments'){
            var id="#"+this.id;
            var error_id="#err"+this.id;
            emptyField(id,error_id);
        }
    });

    $("#consultant_workspaces").on('change',function(){
        getWorkspaceProjects(me.user_info,$("#consultant_workspaces").find("option:selected").attr("name"));
    });

});

function loadProjects(user_info){
    if (window.location.pathname.includes('/home/consultant')){
        //do nothing

    }
    else{
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
                        $("#projectListContainer ul").append('<li class="proj-list-li"><div class="row"><a class="proj-list-a" href="/project/'+item.project_factor+'" name="'+item.project_id+'" style="width:90%;">'+item.name+'</a><a class="proj-list-a get-project-info" href="#" style="width:10%;" data-toggle="tooltip" title="Obtener información sobre este proyecto"><i class="fa fa-info"></i></a></div></li>');
                    });
                    $(".get-project-info").click(function(){
                        var project_id=$(this).siblings('a')[0].name;
                        $.ajax({
                            url:'/project/getProjectFormsInfo',
                            type:'POST',
                            data:JSON.stringify({'project_id':project_id,'user_id':user_info['user_id']}),
                            success:function(response){
                                try{
                                    var res=JSON.parse(response);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res.success){
                                    $("#mod_project_form_info").modal("show");
                                    for (var x of res.data){
                                        $("#grdProjFormInfo").append('<tr><td>'+x['name']+'</td><td>'+x['status']+'</td><td><a href="'+x['link']+'" role="button" class="btn btn-primary btn-sm">Ir</a></td></tr>')
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

function getConsultantWorkspaces(user_info,is_first){
    //el segundo parámetro sirve para saber si es la primera vez que se carga el select, para también mandar a llamar los proyectos en cuanto termina la petición ajax de los espacios de trabajo, se obtendrán los proyectos del último espacio de trabajo regresado en orden alfabético
    $.ajax({
        url:'/project/getConsultantWorkspaces',
        type:'POST',
        data:JSON.stringify({'user_id':user_info.user_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError()
            }
            if (res.success){
                $.each(res.data,function(i,item){
                    $("#consultant_workspaces").append($('<option>',{
                        text:item.name,
                        name:item.workspace_id,
                        selected:true
                    }));
                });
                if (is_first===true){

                    var ws_len=res.data.length;
                    getWorkspaceProjects(user_info,res.data[ws_len-1]['workspace_id']);
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

function getWorkspaceProjects(user_info,workspace_id){
    $.ajax({
        url:'/project/getConsultantProjects',
        type:'POST',
        data:JSON.stringify({'user_id':user_info['user_id'],'workspace_id':workspace_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#projectListContainerCons ul").children().remove();
                $.each(res.data,function(i,item){
                    $("#projectListContainerCons ul").append('<li class="proj-list-li"><div class="row"><a class="proj-list-a" href="/project/'+item.project_factor+'" name="'+item.project_id+'" style="width:90%;">'+item.name+'</a><a class="proj-list-a get-project-info" href="#" style="width:10%;" data-toggle="tooltip" title="Obtener información sobre este proyecto"><i class="fa fa-info"></i></a></div></li>');
                });
                $(".get-project-info").click(function(){
                    var project_id=$(this).siblings('a')[0].name;
                    $.ajax({
                        url:'/project/getProjectFormsInfo',
                        type:'POST',
                        data:JSON.stringify({'project_id':project_id,'user_id':user_info['user_id']}),
                        success:function(response){
                            try{
                                var res=JSON.parse(response);
                            }catch(err){
                                ajaxError();
                            }
                            if (res.success){
                                $("#mod_project_form_info").modal("show");
                                for (var x of res.data){
                                    $("#grdProjFormInfo").append('<tr><td>'+x['name']+'</td><td>'+x['status']+'</td><td><a href="'+x['link']+'" role="button" class="btn btn-primary btn-sm">Ir</a></td></tr>')
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
