$(document).ready(function(){
    var me = this;

    var today=new Date().toISOString().split("T")[0];
    var split_date=today.split("-");
    split_date[2]="01";
    var first_day=split_date.join("-");
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    loadProjects(); //carga de inicio los proyectos

    var location=window.location.pathname;
    if (location.split('/')[1]=='project'){
        loadFormPanel(me.user_info,location);
    }

    $("#mod_new_project").on('show.bs.modal',function(){
        $("#NPdateFrom").val(first_day);
        $("#NPdateTo").val(today);
        $.ajax({
            url:'/users/getUserList',
            type:'POST',
            data:{},
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
                                        loadProjects();
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
});

function loadProjects(){
    $.ajax({
        url:'/project/getProjects',
        type:'POST',
        data:{},
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
    var url=location+'/getUnpublishedForms';
    console.log(user_info);
    $.ajax({
        url:url,
        type:'POST',
        data:JSON.stringify({'project_id':user_info.project_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divFormPanel ul").children().remove();
                $.each(res.data,function(i,item){
                    $("#divFormPanel ul").append('<li><a href="#">'+item.name+'</a></li>')
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
    })
}
