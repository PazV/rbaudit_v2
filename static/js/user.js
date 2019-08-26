$(document).ready(function(){
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    var me = this;

    $("#btnChangePassword").click(function(){
        $("#password_collapse").toggle(300);
    });

    $("#NUuser_image").change(function(){
        var path=$("#NUuser_image")[0].value.split("\\").pop();
        $("#NUuser_image").siblings("label").html(path);
    });

    $("#mod_new_user").on('hidden.bs.modal',function(){
        $("#NUuser_image").siblings("label").html("Seleccionar imagen");
    });

    $("#MAuser_image").change(function(){
        var path=$("#MAuser_image")[0].value.split("\\").pop();
        $("#MAuser_image").siblings("label").html(path);
        var pattern=$("#MAuser_image")[0].pattern.split(",");
        if (hasExtension("MAuser_image",pattern)){
            $("#MAuser_image").parent('.custom-file').addClass('valid-file-field').removeClass('invalid-file-field');
            $("#errMAuser_image").removeClass('show-error-msg').addClass('hide-error-msg');
        }
        else{
            $("#MAuser_image").parent('.custom-file').removeClass('valid-file-field').addClass('invalid-file-field');
            $("#errMAuser_image").html("Formato incorrecto");
            $("#errMAuser_image").addClass('show-error-msg').removeClass('hide-error-msg');
        }
    });

    $("#mod_my_account").on('hide.bs.modal',function(){
        $("#MAuser_image").siblings("label").html("Seleccionar imagen");
        resetForm("#frmMAgeneral",["input|INPUT"]);
        resetForm("#frmMApassword",["input|INPUT"]);
        $("#MAold_password").attr('type','password');
        $("#MAnew_password").attr('type','password');
        $("#MAconfirm_password").attr('type','password');
        if ($("#password_collapse").is(':visible')){
            $("#password_collapse").toggle();
        }
    });


    $("#NUuser_image").on('change',function(){
        var pattern=$("#NUuser_image")[0].pattern.split(",");
        if (hasExtension("NUuser_image",pattern)){
            $("#NUuser_image").parent('.custom-file').addClass('valid-file-field').removeClass('invalid-file-field');
            $("#errNUuser_image").removeClass('show-error-msg').addClass('hide-error-msg');
        }
        else{
            $("#NUuser_image").parent('.custom-file').removeClass('valid-file-field').addClass('invalid-file-field');
            $("#errNUuser_image").html("Formato incorrecto");
            $("#errNUuser_image").addClass('show-error-msg').removeClass('hide-error-msg');
        }
        this.blur();//para quitar focus del input y se vea el border rojo o verde, dependiendo de si es válido o no
    });

    $("#btnSaveUser").click(function(){
        if (emptyField("#NUname","#errNUname")===true){
            if (emptyField("#NUemail","#errNUemail")===true){
                if (validateMail("#NUemail","#errNUemail")){
                    var frm = getForm('#frmNewUser',null,true);
                    frm['user_id']=-1;
                    var data = new FormData();
                    if ($("#NUuser_image")[0].files.length==1){
                        if ($("#NUuser_image").parent('.custom-file').hasClass('valid-file-field')){
                            var file_size=$("#NUuser_image")[0].files[0].size;
                            if ((file_size/1024/1024)<=0.5){
                                var file = $("#NUuser_image")[0].files[0];
                                var file_name=$("#NUuser_image")[0].files[0].name;
                                data.append(file_name,file);
                            }
                            else{
                                $.alert({
                                    theme:'dark',
                                    title:'Atención',
                                    content:'El tamaño de la imagen no debe ser mayor de 1 MB.'
                                });
                            }
                        }
                        else{
                            $.alert({
                                theme:'dark',
                                title:'Atención',
                                content:'El formato de la imagen es incorrecto. Debe ser .png, .jpg o .jpeg'
                            });
                        }
                    }
                    else{
                        var file_name=false;
                    }
                    data.append('file_name',file_name);
                    for (var key in frm){
                        if (frm.hasOwnProperty(key)){
                            data.append(key,frm[key]);
                        }
                    }
                    EasyLoading.show({
                        text:'Cargando...',
                        type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                    });
                    $.ajax({
                        url:'/users/saveUser',
                        data:data,
                        type:'POST',
                        processData:false,
                        contentType:false,
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
                                            text:'OK',
                                            action:function(){
                                                $("#mod_new_user").modal("hide");
                                                getUserTable();
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
                            EasyLoading.hide();
                            $.alert({
                                theme:'dark',
                                title:'Atención',
                                content:'Sucedió un error, favor de intentarlo de nuevo más tarde.'
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

            }else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Existen campos incorrectos o vacíos, favor de revisar.'
                });
            }
        }else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Existen campos incorrectos o vacíos, favor de revisar.'
            });
        }
    });

    $("#mod_new_user").on('hide.bs.modal',function(){
        resetForm("#frmNewUser",["input|INPUT","select|SELECT"]);
    });

    $("#btnModNewUser").click(function(){
        $("#mod_new_user").modal("show");
    });

    $("#mod_admin_users").on('shown.bs.modal',function(){
        getUserTable();
    });

    $("#btnSignOut").click(function(){
        $.confirm({
            theme:'dark',
            title:'Atención',
            content:'¿Estás seguro que deseas salir?',
            buttons:{
                confirm:{
                    text:'Sí',
                    action:function(){
                        $.ajax({
                            url:'/login/signout',
                            data:{},
                            type:'GET',
                            success:function(){
                                location.reload();
                            },
                            error:function(error){
                                console.log(error);
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

    $("#mod_my_account").on('show.bs.modal',function(){
        console.log("show modal");
        $.ajax({
            url:'/users/getAccountInfo',
            type:'POST',
            data:JSON.stringify({'user_id':me.user_info.user_id}),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                if (res.success){
                    console.log(res.data);
                    $("#MAname").val(res.data.name);
                    $("#MAemail").val(res.data.email);
                    $("#mod_my_account").data('user_id',res.data.user_id);
                    if (res.data.profile_picture_class!='generic-user-img'){
                        $("#btnMAremoveImage").prop("disabled",false);
                    }
                    else{
                        $("#btnMAremoveImage").prop("disabled",true);
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
                    content:'Ocurrió un problema, favor de intentarlo de nuevo.'
                });
            }
        });
    });

    $("#btnMAremoveImage").click(function(){
        $.confirm({
            theme:'dark',
            title:'Atención',
            content:'¿Está seguro que desea remover la imagen de perfil?',
            buttons:{
                confirm:{
                    text:'Sí',
                    action:function(){
                        $.ajax({
                            url:'/users/removeProfileImage',
                            type:'POST',
                            data:JSON.stringify({'user_id':me.user_info.user_id}),
                            success:function(response){
                                try{
                                    var res=JSON.parse(response);
                                }catch(err){
                                    ajaxError();
                                }
                                if (res.success){
                                    $("#btnMAremoveImage").prop("disabled",true);
                                    $.alert({
                                        theme:'dark',
                                        title:'Atención',
                                        content:res.msg_response
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
                        })
                    }
                },
                cancel:{
                    text:'No'
                }
            }
        })
    });

    $("#btnSaveMyAccount").click(function(){
        $("#frmMAgeneral .form-control").focusout();
        var valid=false;
        if ($("#MAname").hasClass('valid-field') && $("#MAemail").hasClass('valid-field')){
            valid=true;
        }
        else{
            valid=false;
        }
        var w_pass=false;
        if ($("#password_collapse").is(":visible") && valid===true){
            w_pass=true;
            $("#frmMApassword .form-control").focusout();
            if ($("#MAold_password").hasClass('valid-field') && $("#MAnew_password").hasClass('valid-field') &&
            $("#MAconfirm_password").hasClass('valid-field')){
                valid=true;
            }
            else{
                valid=false;
            }
        }
        if (valid===true){
            var data = new FormData();
            var img_valid=false;
            var error_msg="";
            if ($("#MAuser_image")[0].files.length==1){ //revisa si contiene alguna imagen
                if ($("#MAuser_image").parent('.custom-file').hasClass('valid-file-field')){ //revisa si tiene el formato correcto
                    var file_size=$("#MAuser_image")[0].files[0].size;
                    if ((file_size/1024/1024)<=0.5){ //revisa si tiene el tamaño correcto
                        img_valid=true;
                        var file=$("#MAuser_image")[0].files[0];
                        var file_name=$("#MAuser_image")[0].files[0].name;
                        data.append(file_name,file);
                        data.append('file_name',file_name);
                    }
                    else{
                        error_msg='El tamaño de la imagen no puede ser mayor a 512 kB.';
                    }
                }
                else{
                    error_msg='El formato de la imagen seleccionada debe ser .png, .jpg o .jpeg.';
                }
            }
            else{ //si no contiene ninguna imagen
                img_valid=true;
                data.append('file_name',false);
            }
            if (img_valid===true){
                var frm_gen=getForm('#frmMAgeneral',[]);
                data.append('user_id',me.user_info['user_id']);
                data.append('name',frm_gen['name']);
                data.append('email',frm_gen['email']);
                if (w_pass===true){
                    data['password_data']=getForm("#frmMApassword");
                    data.append('password_data',JSON.stringify(getForm("#frmMApassword")));
                }
                else{
                    data.append('password_data',false);
                }
                console.log(data);
                EasyLoading.show({
                    text:'Cargando...',
                    type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                });
                $.ajax({
                    url:'/users/saveUser',
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
                        if (res.success){
                            $.alert({
                                theme:'dark',
                                title:'Atención',
                                content:res.msg_response,
                                buttons:{
                                    confirm:{
                                        text:'OK',
                                        action:function(){
                                            $("#mod_my_account").modal("hide");
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
                    content:error_msg
                });
            }
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Existen campos incorrectos o vacíos, favor de revisar.'
            });
        }
        console.log(valid);
    });

    $("#frmMAgeneral .form-control").focusout(function(){
        var id="#"+this.id;
        var error_id="#err"+this.id;
        emptyField(id,error_id);
        if (id=='#MAemail'){
            validateMail('#MAemail','#errMAemail');
        }
    });

    $("#frmMApassword .form-control").focusout(function(){
        var id="#"+this.id;
        var error_id="#err"+this.id;
        emptyField(id,error_id);
        if (id=='#MAconfirm_password'){
            if ($("#MAconfirm_password").val()!==$("#MAnew_password").val()){
                $("#MAconfirm_password").removeClass('valid-field').addClass('invalid-field');
                $("#errMAconfirm_password").html('La contraseña no coincide');
                $("#errMAconfirm_password").removeClass('hide-error-msg').addClass('show-error-msg');
            }
        }
    });

    $("#MAch_show_old_password").click(function(){
        if ($("#MAch_show_old_password")[0].checked){
            $("#MAold_password").attr("type","text");
        }
        else{
            $("#MAold_password").attr("type","password");
        }
    });

    $("#MAch_show_new_password").click(function(){
        if ($("#MAch_show_new_password")[0].checked){
            $("#MAnew_password").attr("type","text");
        }
        else{
            $("#MAnew_password").attr("type","password");
        }
    });

    $("#MAch_show_confirm_password").click(function(){
        if($("#MAch_show_confirm_password")[0].checked){
            $("#MAconfirm_password").attr("type","text");
        }
        else{
            $("#MAconfirm_password").attr("type","password");
        }
    });

    $("#mod_admin_project_users").on('shown.bs.modal',function(){
        $("#APUuser").empty();
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
                        $("#APUuser").append($('<option>',{
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
        loadProjectUsersTable(me.user_info['project_id']);
    });

    $("#btnAPUaddUser").click(function(){
        EasyLoading.show({
            text:'Cargando...',
            type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
        });
        $.ajax({
            url:'/users/addProjectUser',
            type:'POST',
            data:JSON.stringify({
                'user_id':$("#APUuser").find("option:selected").attr("name"),
                'project_id':me.user_info['project_id']
            }),
            success:function(response){
                try{
                    var res=JSON.parse(response);
                }catch(err){
                    ajaxError();
                }
                EasyLoading.hide();
                if (res.success){
                    loadProjectUsersTable(me.user_info['project_id']);
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

    $("#btnAPUremoveUser").click(function(){

    });

    $("#btnAPUseePermits").click(function(){
        var table=$("#grdAdminProjectUsers").DataTable();
        if (table.rows('.selected').any()){
            var ind=table.row('.selected').index();
            var record=table.rows(ind).data()[0];
            $.ajax({
                url:'/users/getProjectUserPermits',
                type:'POST',
                data:JSON.stringify({'user_id':record['user_id']}),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        $("#divProjectUserPermits").empty();
                        $("#mod_project_user_permits").modal("show");
                        $("#divProjectUserPermits").append(res.data)
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
                content:'Debe seleccionar un usuario para ver sus permisos.'
            });
        }
    });

    $("#btnModEditUser").click(function(){
        var table=$("#grdAdminUsers").DataTable();
        if (table.rows('.selected').any()){
            var ind=table.row('.selected').index();
            var record=table.rows(ind).data()[0];
            $.ajax({
                url:'/users/getUserPermits',
                type:'POST',
                data:JSON.stringify({'user_id':record['user_id']}),
                success:function(response){
                    try{
                        var res=JSON.parse(response);
                    }catch(err){
                        ajaxError();
                    }
                    if (res.success){
                        var keys=Object.keys(res.data);
                        for (var x of keys){
                            $("#EdUch_"+x).prop("checked",res.data[x]);
                        }
                        $("#EdUname").val(record['name']);
                        $("#EdUemail").val(record['email']);
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
                        content:'Ocurrió un error al intentar obtener la información, favor de intentarlo de nuevo más tarde.'
                    });
                }
            });
            $("#mod_edit_user").data('user_id',record['user_id']);
            $("#mod_edit_user").modal("show");
        }
        else{
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe seleccionar un usuario para editarlo.'
            });
        }
    });

    $("#frmEditUser .form-control").focusout(function(){
        var id="#"+this.id;
        var error_id="#err"+this.id;
        emptyField(id,error_id);
        if (id=='#EdUemail'){
            validateMail('#EdUemail','#errEdUemail');
        }
    });

    $("#btnEdSaveUser").click(function(){
        $("#frmEditUser .form-control").focusout();
        if ($("#EdUname").hasClass('valid-field') && $("#EdUemail").hasClass('valid-field')){
            var data = getForm('#frmEditUser',null,true);
            data['name']=data['name'].trim();
            data['user_id']=$("#mod_edit_user").data('user_id');
            console.log(data);
            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/users/editUser',
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
                                        $("#mod_edit_user").modal('hide');
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
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Existen datos incorrectos o vacíos, favor de revisar.'
            });
        }
    });

    $("#mod_edit_user").on('hide.bs.modal',function(){
        resetForm("#frmEditUser",["input|INPUT"]);
    });

    $.extend($.fn.dataTable.defaults, {
        "autoWidth":true,
        "searching":false,
        "responsive":true,
        "ordering":false,
        "destroy":true,
        "select":{
            "style":"single",
        },
        "lengthMenu": [ 5, 10, 15, 20, 25 ],
        "language":{
            "decimal":        ".",
            "emptyTable":     "No hay información disponible",
            "info":           "Mostrando _START_ a _END_ de _TOTAL_ registros",
            "infoEmpty":      "Mostrando 0 a 0 de 0 registros",
            "infoFiltered":   "(filtrado de _MAX_ total registros)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Mostrar _MENU_ registros",
            "loadingRecords": "Cargando...",
            "processing":     "Procesando...",
            "search":         "Buscar:",
            "zeroRecords":    "No se encontraron registros",
            "paginate": {
                "first":      "Primero",
                "last":       "Última",
                "next":       "Siguiente",
                "previous":   "Anterior"
            },
            "aria": {
                "sortAscending":  ": activar para ordenar de forma ascendente",
                "sortDescending": ": activar para ordenar de forma descendente"
            },
            "select":{
                "rows":""
            }
        },
    });
});

function getUserTable(){
    $("#grdAdminUsers").DataTable({
        "scrollY":"225px",
        "scrollCollapse":true,
        "lengthChange":false,
        serverSide:true,
        destroy:true,
        ajax:{
            data:{},
            url:'/users/getUserTable',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'profile_picture',"width":"20%"},
            {data:'name',"width":"30%"},
            {data:'email',"width":"35%"},
            {data:'status',"width":"15%"}
        ]
    });
}

function loadProjectUsersTable(project_id){
    $("#grdAdminProjectUsers").DataTable({
        "scrollY":"200px",
        "scrollCollapse":true,
        "lengthChange":false,
        serverSide:true,
        destroy:true,
        ajax:{
            data:{'project_id':project_id},
            url:'/users/getProjectUsers',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'profile_picture',"width":"30%"},
            {data:'name',"width":"80%"}
        ]
    });
}
