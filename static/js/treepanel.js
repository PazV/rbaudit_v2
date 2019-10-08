$(document).ready(function(){
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    var me = this;

    $("#btnNewMenuFolder").click(function(){
        $("#mod_add_folder").data('mode','new');
        $("#divFIparent").css('display','flex');
        $("#mod_add_folder").find('.spn-modal-header').html('Crear carpeta')

        // if ($(".file-tree").find('.selected').length==0){
        // if ($(".file-tree").find('input:checked').length==0){
        // if ($(".folder-checkbox").find('input:checked').length==0){
        if ($(".file-tree").find(".folder-checkbox:checked").length==0){
            $("#FIparent").val('Raíz');
            $("#mod_add_folder").data('parent_id',-1);
            $("#mod_add_folder").modal("show");
        }
        else{
            if ($(".file-tree").find(".folder-checkbox:checked").length==1){
                // $("#FIparent").val($(".file-tree").find('.selected')[0].textContent);
                // $("#mod_add_folder").data('parent_id',$(".file-tree").find('.selected').data('folder'));
                $("#FIparent").val($(".file-tree").find('input:checked').next('li').children('a')[0].textContent);
                $("#mod_add_folder").data('parent_id',$(".file-tree").find('input:checked').next('li').children('a').data('folder'));
                $("#mod_add_folder").modal("show");
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Debe seleccionar solo una carpeta.'
                });
            }
        }
    });

    $("#btnSaveFolder").click(function(){
        var valid=emptyField('#FIname','#errFIname');
        
        if (valid){
            var data={};
            data['name']=encodeURIComponent($("#FIname").val());
            data['mode']=$("#mod_add_folder").data('mode');
            data['user_id']=me.user_info['user_id'];
            if (data['mode']=='new'){
                data['parent_id']=$("#mod_add_folder").data('parent_id');
                data['project_id']=me.user_info['project_id'];
            }
            else{
                data['folder_id']=$("#mod_add_folder").data('folder_id');
            }

            EasyLoading.show({
                text:'Cargando...',
                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
            });
            $.ajax({
                url:'/project/saveFolder',
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
                        $("#mod_add_folder").modal("hide");
                        loadTreeMenu(me.user_info['project_id']);
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

    $("#mod_add_folder").on('hide.bs.modal',function(){
        resetForm('#frmFolderInfo',['input|INPUT']);
    });

    $("#btnEditMenuFolder").click(function(){
        // if ($(".file-tree").find('.selected').length==0){
        // if ($(".file-tree").find('input:checked').length==0){
        if ($(".file-tree").find(".folder-checkbox:checked").length==0){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe seleccionar una carpeta para editarla.'
            });
        }
        else{
            if ($(".file-tree").find(".folder-checkbox:checked").length==1){
                $("#mod_add_folder").data('mode','edit');
                $("#mod_add_folder").find('.spn-modal-header').html('Editar carpeta');
                $("#divFIparent").css('display','none');
                // $("#FIname").val($(".file-tree").find('.selected')[0].textContent);
                // $("#mod_add_folder").data('folder_id',$(".file-tree").find('.selected').data('folder'));
                $("#FIname").val($(".file-tree").find('input:checked').next('li').children('a')[0].textContent);
                $("#mod_add_folder").data('folder_id',$(".file-tree").find('input:checked').next('li').children('a').data('folder'));
                $("#mod_add_folder").modal("show");
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Solo puedes editar una carpeta a la vez.'
                });
            }
        }
    });

    $("#btnCollapseTreepanel").click(function(){
        if ($("#ibtnCollapseTreepanel").hasClass('treepanel-pin-collapsed')){
            $("#ibtnCollapseTreepanel").removeClass('treepanel-pin-collapsed');
            $($("#bodyContent").children().children()[0]).addClass('col-sm-3');
            $($("#bodyContent").children().children()[0]).css("max-width","");
            $($("#bodyContent").children().children()[1]).css("width","");
            $($("#bodyContent").children().children()[1]).css("max-width","");
            if ($("#unpublished_panel").is(':visible')){
                $($("#bodyContent").children().children()[1]).addClass('col-sm-6');
            }
            else{
                $($("#bodyContent").children().children()[1]).css("width","100%");
                $($("#bodyContent").children().children()[1]).css("max-width","70%");
            }
        }
        else{
            $("#ibtnCollapseTreepanel").addClass('treepanel-pin-collapsed');
            $($("#bodyContent").children().children()[0]).css("max-width","5%");
            $($("#bodyContent").children().children()[0]).removeClass('col-sm-3');
            $($("#bodyContent").children().children()[1]).removeClass('col-sm-6');
            $($("#bodyContent").children().children()[1]).css("width","100%");
            if ($("#unpublished_panel").is(':visible')){
                $($("#bodyContent").children().children()[1]).css("max-width","70%");
            }
            else{
                $($("#bodyContent").children().children()[1]).css("max-width","90%");
            }
        }
    });

    $("#btnDeleteMenuFolder").click(function(){
        if ($(".file-tree").find('input:checked').length>0){
            $.confirm({
                theme:'dark',
                title:'Atención',
                content:'¿Está seguro que desea eliminar el contenido seleccionado? (UNA VEZ ELIMINADA, NO PODRÁ SER RECUPERADA DICHA INFORMACIÓN)',
                buttons:{
                    confirm:{
                        text:'Sí',
                        action:function(){
                            var folders=[];
                            for (x of $(".file-tree").find(".folder-checkbox:checked")){
                                folders.push($(x).next().children('a').data('folder'));
                            }
                            var forms=[];
                            for (y of $(".file-tree").find(".form-checkbox:checked")){
                                forms.push($(y).next().children('a')[0].id);
                            }

                            EasyLoading.show({
                                text:'Cargando...',
                                type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
                            });
                            $.ajax({
                                url:'/project/deleteMenuElements',
                                type:'POST',
                                data:JSON.stringify({'user_id':me.user_info['user_id'],'project_id':me.user_info['project_id'],'forms':forms,'folders':folders}),
                                success:function(response){
                                    EasyLoading.hide();
                                    try{
                                        var res=JSON.parse(response);
                                    }catch(err){
                                        ajaxError();
                                    }
                                    if (res.success){
                                        loadTreeMenu(me.user_info['project_id']);
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

function loadTreeMenu(project_id){
    $.ajax({
        url:'/project/getMenu',
        type:'POST',
        data:JSON.stringify({'project_id':project_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divTreeMenu").empty();
                $("#divTreeMenu").append(res.menu);
                $(".file-tree").filetree({
                    animationSpeed: 'fast',
                    collapsed: true
                });
                $(".folder-checkbox, .form-checkbox").on('click',function(e){
                    // console.log(e);
                    if ($("#clonedFormFolder").is(":visible")){
                        if ($(e.target).next().hasClass('selectable-folder')){
                            var folder_id=$(e.target).next().children('a').data('folder');
                            $("#clonedFormFolder").data('folderid',folder_id);
                            $("#clonedFormFolder").val($(e.target).next().children('a')[0].textContent);
                            $(".folder-checkbox").prop("checked",false);
                            $(e.target).prop("checked",true);
                        }
                        if ($(e.target).next().hasClass('selectable-form')){
                            var form_id=$(e.target).next().children('a')[0].id;
                            $("#oldClonedForm").val($(e.target).next().children('a')[0].textContent);
                            $("#oldClonedForm").data('formid',form_id);
                            $(".form-checkbox").prop("checked",false);
                            $(e.target).prop("checked",true);
                        }
                    }
                    if ($("#newFormFolder").is(":visible")){
                        if ($(e.target).next().hasClass('selectable-folder')){
                            var folder_id=$(e.target).next().children('a').data('folder');
                            $("#newFormFolder").data('folderid',folder_id);
                            $("#newFormFolder").val($(e.target).next().children('a')[0].textContent);
                            $(".folder-checkbox").prop("checked",false);
                            $(e.target).prop("checked",true);
                        }
                    }
                    if ($("#newFormImportFolder").is(":visible")){
                        if ($(e.target).next().hasClass('selectable-folder')){
                            var folder_id=$(e.target).next().children('a').data('folder');
                            $("#newFormImportFolder").data('folderid',folder_id);
                            $("#newFormImportFolder").val($(e.target).next().children('a')[0].textContent);
                            $(".folder-checkbox").prop("checked",false);
                            $(e.target).prop("checked",true);
                        }
                    }
                });
                // $(".file-tree").on('click','li',function(e){
                //     $(".file-tree").find('a').css('background-color','');
                //     $(".file-tree").find('a').removeClass('selected');
                //     $(e.target.firstChild).css('background-color','lavender');
                //     $(e.target.firstChild).addClass('selected');
                //     // if ($("#newFormFolder").is(':visible')){
                //     //     $("#newFormFolder").val($(e.target.firstChild)[0].textContent);
                //     // }
                //     // if ($("#newFormImportFolder").is(":visible")){
                //     //     $("#newFormImportFolder").val($(e.target.firstChild)[0].textContent);
                //     // }
                //     // if ($("#clonedFormFolder").is(":visible")){
                //     //     if ($(e.target.firstChild).parent('li').hasClass('selectable-folder')){
                //     //         $("#clonedFormFolder").val($(e.target.firstChild)[0].textContent);
                //     //         $("#clonedFormFolder").data('folderid',$(e.target.firstChild).data('folder'));
                //     //     }
                //     //     if ($(e.target.firstChild).parent('li').hasClass('selectable-form')){
                //     //         $("#oldClonedForm").val($(e.target.firstChild)[0].textContent);
                //     //         $("#oldClonedForm").data('formid',$(e.target.firstChild)[0].id);
                //     //     }
                //     // }
                //
                //
                //     // if ($(e.target.firstChild).hasClass('selected')){
                //     //     $(".file-tree").find('a').css('background-color','');
                //     //     $(".file-tree").find('a').removeClass('selected');
                //     // }
                //     // else if (!$(e.target.firstChild).hasClass('selected')){
                //     //     $(".file-tree").find('a').css('background-color','');
                //     //     $(".file-tree").find('a').removeClass('selected');
                //     //     $(e.target.firstChild).css('background-color','lavender');
                //     //     $(e.target.firstChild).addClass('selected');
                //     // }
                // });
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
