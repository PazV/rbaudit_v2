$(document).ready(function(){
    var me = this;

    var today=new Date().toISOString().split("T")[0];
    var split_date=today.split("-");
    split_date[2]="01";
    var first_day=split_date.join("-");
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    // console.log(this.user_info);
    loadProjects(me.user_info,''); //carga de inicio los proyectos
    var location=window.location.pathname;


    if (location.split('/')[1]=='project'){

        // loadFormPanel(me.user_info,location);
        // loadTreeMenu(me.user_info['project_id']);
        // loadFormsToCheck(me.user_info,location);
        $("#btnOpenNotifications").css("visibility","visible");
    }

    if (window.location.pathname.includes('/my-projects/consultant')){
        getConsultWorkspaces(me.user_info,true,'my_projects')
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
        if (window.location.pathname.includes('/consultant')){
            if (window.location.pathname.includes('/my-projects/consultant')){
                workspace_id=$("#myProjectsConsultWorkspace").find("option:selected").attr("name");
            }
            if (window.location.pathname.includes('/activity-list/consultant')){
                workspace_id=$("#actListConsultWorkspace").find("option:selected").attr("name");
            }
        }
        else{
            workspace_id=me.user_info['workspace_id'];
        }

        // if (window.location.pathname=='/home/'){
        //
        //     workspace_id=me.user_info['workspace_id'];
        // }
        // else{
        //
        //     if (me.user_info['consultant']===true){
        //         workspace_id=$("#consultant_workspaces").find("option:selected").attr("name");
        //     }
        //     else{
        //         workspace_id=me.user_info['workspace_id'];
        //     }
        // }

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
        if (window.location.pathname.includes('/consultant')){
            if (window.location.pathname.includes('/my-projects/consultant')){
                var ws=$("#myProjectsConsultWorkspace").find("option:selected").attr("name");
                include_creator=false; //cuando se crea desde otro espacio de trabajo (como consultor), no se incluye al usuario en los usuarios del proyecto
            }
            if (window.location.pathname.includes('/activity-list/consultant')){
                var ws=$("#actListConsultWorkspace").find("option:selected").attr("name");
                include_creator=false; //cuando se crea desde otro espacio de trabajo (como consultor), no se incluye al usuario en los usuarios del proyecto
            }
        }
        else{
            var ws=me.user_info['workspace_id'];
            include_creator=true; //cuando se crea desde el espacio de trabajo propio, se incluye al usuario en los usuarios del proyecto
        }



        // if (window.location.pathname=='/home/'){
        //     var ws=me.user_info['workspace_id'];
        //     include_creator=true; //cuando se crea desde el espacio de trabajo propio, se incluye al usuario en los usuarios del proyecto
        // }
        // else{
        //     var ws=$("#consultant_workspaces").find("option:selected").attr("name");
        //     include_creator=false; //cuando se crea desde otro espacio de trabajo (como consultor), no se incluye al usuario en los usuarios del proyecto
        // }

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
                                        if (window.location.pathname.includes('/consultant')){
                                            if (window.location.pathname.includes('/my-projects/consultant')){
                                                 getWorkspaceProjects(me.user_info,ws,$("#myProjectsFinderInput").val())
                                            }
                                        }
                                        else{
                                            if (window.location.pathname.includes('/my-projects')){
                                                loadProjects(me.user_info,$("#myProjectsFinderInput").val());
                                            }
                                        }



                                        // if (window.location.pathname=='/home/'){
                                        //     loadProjects(me.user_info);
                                        // }
                                        // else{
                                        //     getWorkspaceProjects(me.user_info,$("#consultant_workspaces").find("option:selected").attr("name"))
                                        // }

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

        if (window.location.pathname.includes('/consultant')){
            var consultant_mode=true;
            if (window.location.pathname.includes('/my-projects/consultant')){
                var workspace_id=$("#myProjectsConsultWorkspace").find("option:selected").attr("name");
            }
            if (window.location.pathname.includes('/activity-list/consultant')){
                var workspace_id=$("#actListConsultWorkspace").find("option:selected").attr("name");
            }
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

            if (window.location.pathname.includes('/consultant')){
                if (window.location.pathname.includes('/my-projects/consultant')){
                    var ws=$("#myProjectsConsultWorkspace").find("option:selected").attr("name");
                }
                if (window.location.pathname.includes('/activity-list/consultant')){
                    var ws=$("#actListConsultWorkspace").find("option:selected").attr("name");
                }
            }
            else{
                var ws=me.user_info['workspace_id'];
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
                                        if (window.location.pathname.includes('/consultant')){
                                            if (window.location.pathname.includes('/my-projects/consultant')){
                                                 getWorkspaceProjects(me.user_info,ws,$("#myProjectsFinderInput").val())
                                            }
                                        }
                                        else{
                                            if (window.location.pathname.includes('/my-projects')){
                                                loadProjects(me.user_info,$("#myProjectsFinderInput").val());
                                            }
                                        }
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
        if (window.location.pathname.includes('/consultant')){
            if (window.location.pathname.includes('/my-projects/consultant')){
                var ws=$("#myProjectsConsultWorkspace").find("option:selected").attr("name");
            }
            if (window.location.pathname.includes('/activity-list/consultant')){
                var ws=$("#actListConsultWorkspace").find("option:selected").attr("name");
            }
        }
        else{
            var ws=me.user_info['workspace_id'];
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
                        if (window.location.pathname.includes('/consultant')){
                            // if (window.location.pathname.includes('/my-projects/consultant')){
                            //     var ws=$("#myProjectsConsultWorkspace").find("option:selected").attr("name");
                            // }
                            // if (window.location.pathname.includes('/activity-list/consultant')){
                            //     var ws=$("#actListConsultWorkspace").find("option:selected").attr("name");
                            // }
                            var url='/project/getConsultantProjects';
                            var aj_data={'user_id':me.user_info['user_id'],'workspace_id':ws,'filters':''};
                        }
                        else{
                            // var ws=me.user_info['workspace_id'];
                            var url='/project/getProjects';
                            var aj_data={'user_id':me.user_info['user_id'],'filters':''}
                        }


                        // if (window.location.pathname=='/home/'){
                        //     var ws=me.user_info['workspace_id'];
                        //     var url='/project/getProjects';
                        //     var aj_data={'user_id':me.user_info['user_id']};
                        // }
                        // else{
                        //     var ws=$("#consultant_workspaces").find("option:selected").attr("name");
                        //     var url='/project/getConsultantProjects';
                        //     var aj_data={'user_id':me.user_info['user_id'],'workspace_id':ws}
                        // }


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

        getWorkspaceProjects(me.user_info,$("#consultant_workspaces").find("option:selected").attr("name"),$("#myProjectsFinderInput").val());

    });

    $("#myProjectsConsultWorkspace").on('change',function(){
        $("#myProjectsFinderInput").val("");
        var selected=$("option:selected", this);
        var sel_value=$(selected).attr('name');
        getWorkspaceProjects(me.user_info,sel_value,$("#myProjectsFinderInput").val());
    });

    $("#myProjectsFinderInput").on('keyup',function(a){
        if (window.location.pathname.includes('/consultant')){
            var selected=$("option:selected", $("#myProjectsConsultWorkspace"));
            var sel_value=$(selected).attr('name');
            getWorkspaceProjects(me.user_info,sel_value,a.target.value);
        }
        else{
            loadProjects(me.user_info,a.target.value);
        }
    });

    $("#aHomeMP").click(function(){
        console.log($(this).data('projectid'));
        if (window.location.pathname.includes('/my-projects')){
            $("#div-include-fmp").empty();
            getFirstMenuFolders($(this).data('projectid'));
        }
    });

    $("#aHomeMPMod").click(function(){
        $("#div-include-fmp-mod").empty();
        getFirstMenuFoldersMod($("#aHomeMP").data('projectid'),"#divMPFoldersContMod","#newFormFolder","#div-include-fmp-mod");
    });

    $("#aHomeMPModImport").click(function(){
        $("#div-include-fmp-mod-import").empty();
        getFirstMenuFoldersMod($("#aHomeMP").data('projectid'),"#divMPFoldersContModImport","#newFormImportFolder","#div-include-fmp-mod-import");
    });

    $("#aHomeMPModClone").click(function(){
        $("#div-include-fmp-mod-clone").empty();
        getFirstMenuFoldersMod($("#aHomeMP").data('projectid'),"#divMPFoldersContModClone","#clonedFormFolder","#div-include-fmp-mod-clone");
    });

    $("#btnEditFormFolder").click(function(){
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

    $("#btnRemoveFormFolder").click(function(){
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

function loadProjects(user_info,filter_str){
    if (window.location.pathname.includes('/home/consultant')){
        //do nothing

    }
    else{
        $.ajax({
            url:'/project/getProjects',
            type:'POST',
            data:JSON.stringify({'user_id':user_info['user_id'],'filters':filter_str.trim()}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    $("#myProjectsUl").children().remove();
                    $.each(res.data,function(i,item){
                        // $("#myProjectsUl").append('<li class="proj-list-li"><div class="row row-wo-margin justify-content-between"><a class="proj-list-a" name="'+item.project_id+'" style="width:93%;" data-companyname="'+item.company_name+'" data-startdate="'+item.start_date+'" data-finishdate="'+item.finish_date+'" data-createdate="'+item.created+'" data-projectfactor="'+item.project_factor+'">'+item.name+'</a><a class="a-project-ext-link" target="_blank" href="/project/'+item.project_factor+'"><i class="fa fa-external-link"></i></a></div></li>')
                        $("#myProjectsUl").append('<li class="proj-list-li"><div class="row row-wo-margin justify-content-between"><a class="proj-list-a" name="'+item.project_id+'" style="width:93%;" data-companyname="'+item.company_name+'" data-startdate="'+item.start_date+'" data-finishdate="'+item.finish_date+'" data-createdate="'+item.created+'" data-projectfactor="'+item.project_factor+'">'+item.name+'</a></div></li>')
                    });

                    $(".proj-list-a").click(function(){
                        $("#spnMyProjectName").html($(this).html());
                        $("#spnMyProjectName").attr('title',$(this).html());
                        $("#div-include-fmp").empty();

                        $("#aHomeMP").data('projectid',$(this).attr('name'));
                        $("#aHomeMP").data('projectfactor',$(this).data('projectfactor'));

                        $("#divMPcreateDate").html($(this).data('createdate'));
                        $("#divMPstartDate").html($(this).data('startdate'));
                        $("#divMPfinishDate").html($(this).data('finishdate'));
                        $("#divMPcompanyName").find('p').html($(this).data('companyname'));
                        // $("#divMPlastUpdated").html($(this).cata(''))
                        getFirstMenuFolders($(this)[0].name);
                        $(".btn-mP-top-menu").prop("disabled",false);
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
                    getWorkspaceProjects(user_info,res.data[ws_len-1]['workspace_id'],$("#myProjectsFinderInput").val());
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

function getWorkspaceProjects(user_info,workspace_id,filter_str){
    console.log(filter_str);
    $.ajax({
        url:'/project/getConsultantProjects',
        type:'POST',
        data:JSON.stringify({'user_id':user_info['user_id'],'workspace_id':workspace_id,'filters':filter_str.trim()}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#myProjectsUl").children().remove();
                $.each(res.data,function(i,item){
                    $("#myProjectsUl").append('<li class="proj-list-li"><div class="row row-wo-margin justify-content-between"><a class="proj-list-a" name="'+item.project_id+'" style="width:93%;" data-companyname="'+item.company_name+'" data-startdate="'+item.start_date+'" data-finishdate="'+item.finish_date+'" data-createdate="'+item.created+'" data-projectfactor="'+item.project_factor+'">'+item.name+'</a><a class="a-project-ext-link" target="_blank" href="/project/'+item.project_factor+'"><i class="fa fa-external-link"></i></a></div></li>')
                });

                $(".proj-list-a").click(function(){
                    $("#spnMyProjectName").html($(this).html());
                    $("#spnMyProjectName").attr('title',$(this).html());
                    $("#div-include-fmp").empty();

                    $("#aHomeMP").data('projectid',$(this).attr('name'));
                    $("#aHomeMP").data('projectfactor',$(this).data('projectfactor'));

                    $("#divMPcreateDate").html($(this).data('createdate'));
                    $("#divMPstartDate").html($(this).data('startdate'));
                    $("#divMPfinishDate").html($(this).data('finishdate'));
                    $("#divMPcompanyName").find('p').html($(this).data('companyname'));
                    getFirstMenuFolders($(this)[0].name);
                    $(".btn-mP-top-menu").prop("disabled",false);
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

function getFirstMenuFolders(project_id){
    $.ajax({
        url:'/my-projects/getFirstMenuFolders',
        type:'POST',
        data:JSON.stringify({'project_id':project_id,'mode':'main'}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divMPFoldersCont").empty();
                $("#divMPFoldersCont").append(res.data);
                $(".folder-icon-div").dblclick(function(){
                    //incluir carpeta en path superior

                    $("#div-include-fmp").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a><div>');
                    $("#div-include-fmp").addClass('row');
                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder").click(function(){
                        returnSubFolder($(this).data('folder'),project_id);
                        console.log($(this));
                        $(this).parent('.div-return-menu-subfolder').remove();
                    });
                    //obtener subcarpetas
                    getSubfoldersForms($($(this).children(".checkbox-folder-menu")).data('document'),project_id);
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

function getSubfoldersForms(folder_id,project_id){
    $.ajax({
        url:'/my-projects/getSubfoldersForms',
        type:'POST',
        data:JSON.stringify({'folder_id':folder_id,'project_id':project_id,'mode':'main'}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divMPFoldersCont").empty();
                $("#divMPFoldersCont").append(res.data);
                $(".folder-icon-div").dblclick(function(){

                    console.log(this);

                    $("#div-include-fmp").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a></div>');
                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder").click(function(){
                        returnSubFolder($(this).data('folder'),project_id);

                        // $(this).remove();
                        $(this).parent('.div-return-menu-subfolder') .remove();
                    });

                    getSubfoldersForms($($(this).children(".checkbox-folder-menu")).data('document'),project_id);
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

function returnSubFolder(parent_id,project_id){
    $.ajax({
        url:'/my-projects/returnSubFolder',
        type:'POST',
        data:JSON.stringify({'parent_id':parent_id,'project_id':project_id,'mode':'main'}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divMPFoldersCont").empty();
                $("#divMPFoldersCont").append(res.data);
                $(".folder-icon-div").dblclick(function(){
                    console.log($($(this).children(".checkbox-folder-menu")).data('document'));

                    $("#div-include-fmp").append('<div class="div-return-menu-subfolder" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a></div>');
                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder").click(function(){
                        returnSubFolder($(this).data('folder'),project_id);
                        // $(this).remove();
                        $(this).parent('.div-return-menu-subfolder') .remove();
                    });

                    getSubfoldersForms($($(this).children(".checkbox-folder-menu")).data('document'),project_id);
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

function getFirstMenuFoldersMod(project_id,div_id,folder_input,home_div_id){
    $.ajax({
        url:'/my-projects/getFirstMenuFolders',
        type:'POST',
        data:JSON.stringify({'project_id':project_id,'mode':'mod'}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                // $("#divMPFoldersContMod").empty();
                // $("#divMPFoldersContMod").append(res.data);
                $(div_id).empty();
                $(div_id).append(res.data);
                $(".folder-icon-div-mod").dblclick(function(){
                    //incluir carpeta en path superior

                    // $("#div-include-fmp-mod").append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a><div>');
                    $(home_div_id).append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$($(this).children(".checkbox-folder-menu-mod")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a><div>');

                    // $("#div-include-fmp-mod").addClass('row');
                    $(home_div_id).addClass('row');


                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder-mod").click(function(){
                        returnSubFolderMod($(this).data('folder'),project_id,div_id,folder_input,home_div_id);
                        console.log($(this));
                        $(this).parent('.div-return-menu-subfolder-mod').remove();

                    });
                    //obtener subcarpetas
                    getSubfoldersFormsMod($($(this).children(".checkbox-folder-menu-mod")).data('document'),project_id,div_id,folder_input,home_div_id);

                    // $("#newFormFolder").val($(this).find('.mp-a-folder')[0].title);
                    // $("#newFormFolder").data('folderid',$($(this).children(".checkbox-folder-menu")).data('document'));
                    $(folder_input).val($(this).find('.mp-a-folder')[0].title);
                    $(folder_input).data('folderid',$($(this).children(".checkbox-folder-menu-mod")).data('document'));
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

function getSubfoldersFormsMod(folder_id,project_id,div_id,folder_input,home_div_id){
    $.ajax({
        url:'/my-projects/getSubfoldersForms',
        type:'POST',
        data:JSON.stringify({'folder_id':folder_id,'project_id':project_id,'mode':'mod'}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                // $("#divMPFoldersContMod").empty();
                // $("#divMPFoldersContMod").append(res.data);
                $(div_id).empty();
                $(div_id).append(res.data);
                $(".folder-icon-div-mod").dblclick(function(){


                    // $("#div-include-fmp-mod").append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a></div>');
                    $(home_div_id).append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$($(this).children(".checkbox-folder-menu-mod")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a></div>');
                    // $("#div-include-fmp-mod").addClass('row');
                    $(home_div_id).addClass('row');
                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder-mod").click(function(){
                        returnSubFolderMod($(this).data('folder'),project_id,div_id,folder_input,home_div_id);

                        // $(this).remove();
                        $(this).parent('.div-return-menu-subfolder-mod').remove();
                    });

                    getSubfoldersFormsMod($($(this).children(".checkbox-folder-menu-mod")).data('document'),project_id,div_id,folder_input,home_div_id);

                    // $("#newFormFolder").val($(this).find('.mp-a-folder')[0].title);
                    // $("#newFormFolder").data('folderid',$($(this).children(".checkbox-folder-menu")).data('document'));
                    $(folder_input).val($(this).find('.mp-a-folder')[0].title);
                    $(folder_input).data('folderid',$($(this).children(".checkbox-folder-menu")).data('document'));
                });

                if ($("#mod_create_form_clone").is(":visible")){
                    $(".checkbox-form-menu-mod").change(function(e){
                        if ($(e.currentTarget).is(":checked")){
                            $("#oldClonedForm").data('formid',$(e.currentTarget).data('document'));
                            $("#oldClonedForm").val($(e.currentTarget).next('div').find('.mp-a-folder')[0].title);
                        }
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
        failure:function(){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un error, favor de intentarlo de nuevo.'
            });
        }
    })
}

function returnSubFolderMod(parent_id,project_id,div_id,folder_input,home_div_id){
    $.ajax({
        url:'/my-projects/returnSubFolder',
        type:'POST',
        data:JSON.stringify({'parent_id':parent_id,'project_id':project_id,'mode':'mod'}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                // $("#divMPFoldersContMod").empty();
                // $("#divMPFoldersContMod").append(res.data);
                $(div_id).empty();
                $(div_id).append(res.data);
                console.log($(".return-menu-subfolder-mod").length);
                if ($(".return-menu-subfolder-mod").length!=0){
                    var folder_name=$(".return-menu-subfolder-mod").last()[0].text;
                    var folder_id=$(".return-menu-subfolder-mod").last().data('folder');
                }
                else{
                    var folder_name='Home';
                    var folder_id=-1;
                }
                // $("#newFormFolder").val(folder_name);
                // $("#newFormFolder").data('folderid',folder_id);
                $(folder_input).val(folder_name);
                $(folder_input).data('folderid',folder_id);
                $(".folder-icon-div-mod").dblclick(function(){
                    // console.log($($(this).children(".checkbox-folder-menu")).data('document'));

                    // $("#div-include-fmp-mod").append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$($(this).children(".checkbox-folder-menu")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a></div>');
                    $(home_div_id).append('<div class="div-return-menu-subfolder-mod" data-toggle="tooltip" title="'+$(this).find('.mp-a-folder')[0].title+'"><a href="#" class="return-menu-subfolder-mod" data-folder="'+$($(this).children(".checkbox-folder-menu-mod")).data('document')+'"><i class="fa fa-folder-open icon-form-path"><span class="spn-form-menu-path">'+$(this).find('.mp-a-folder')[0].title+'</span></i></a></div>');
                    // $("#div-include-fmp-mod").addClass('row');
                    $(home_div_id).addClass('row');
                    //evento para regresar a la carpeta anterior
                    $(".return-menu-subfolder-mod").click(function(){
                        returnSubFolderMod($(this).data('folder'),project_id,div_id,folder_input,home_div_id);
                        // $(this).remove();
                        $(this).parent('.div-return-menu-subfolder-mod').remove();
                    });

                    getSubfoldersFormsMod($($(this).children(".checkbox-folder-menu-mod")).data('document'),project_id,div_id,folder_input,home_div_id);

                    // $("#newFormFolder").val($(this).find('.mp-a-folder')[0].title);
                    // $("#newFormFolder").data('folderid',$($(this).children(".checkbox-folder-menu")).data('document'));
                    $(folder_input).val($(this).find('.mp-a-folder')[0].title);
                    $(folder_input).data('folderid',$($(this).children(".checkbox-folder-menu-mod")).data('document'));
                });

                if ($("#mod_create_form_clone").is(":visible")){
                    $(".checkbox-form-menu-mod").change(function(e){
                        if ($(e.currentTarget).is(":checked")){
                            $("#oldClonedForm").data('formid',$(e.currentTarget).data('document'));
                            $("#oldClonedForm").val($(e.currentTarget).next('div').find('.mp-a-folder')[0].title);
                        }
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
        failure:function(){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un error, favor de intentarlo de nuevo.'
            });
        }
    })
}
