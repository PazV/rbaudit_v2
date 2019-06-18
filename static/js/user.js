$(document).ready(function(){
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
    });

    $("#mod_my_account").on('hidden.bs.modal',function(){
        $("#MAuser_image").siblings("label").html("Seleccionar imagen");
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
                            if ((file_size/1024/1024)<=1){
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
        })
    });

    $("#btnSaveMyAccount").click(function(){
        $("#frmMAgeneral .form-control").focusout();
        if ($("#password_collapse").is(":visible")){
            $("#frmMApassword .form-control").focusout();
        }
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
