$(document).ready(function(){
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    var me = this;

    $("#btnNewMenuFolder").click(function(){
        $("#mod_add_folder").data('mode','new');
        $("#divFIparent").css('display','flex');
        $("#mod_add_folder").find('.spn-modal-header').html('Crear carpeta')
        $("#mod_add_folder").modal("show");
        if ($(".file-tree").find('.selected').length==0){
            $("#FIparent").val('Raíz');
            $("#mod_add_folder").data('parent_id',-1);
        }
        else{
            $("#FIparent").val($(".file-tree").find('.selected')[0].textContent);
            $("#mod_add_folder").data('parent_id',$(".file-tree").find('.selected').data('folder'));
        }
    });

    $("#btnSaveFolder").click(function(){
        var valid=emptyField('#FIname','#errFIname');
        console.log(me.user_info);
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
        if ($(".file-tree").find('.selected').length==0){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Debe seleccionar una carpeta para editarla.'
            });
        }
        else{
            $("#mod_add_folder").data('mode','edit');
            $("#mod_add_folder").find('.spn-modal-header').html('Editar carpeta');
            $("#divFIparent").css('display','none');
            $("#FIname").val($(".file-tree").find('.selected')[0].textContent);
            $("#mod_add_folder").data('folder_id',$(".file-tree").find('.selected').data('folder'));
            $("#mod_add_folder").modal("show");
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

    // $("#btnDeleteMenuFolder").click(function(){
    //     if ($(".file-tree").find('.selected').length==0){
    //         $.alert({
    //             theme:'dark',
    //             title:'Atención',
    //             content:'Debe seleccionar una carpeta para eliminarla.'
    //         });
    //     }
    //     else{
    //         $.confirm({
    //             theme:'dark',
    //             title:'Atención',
    //             content:'¿Está seguro que desea eliminar la carpeta '+$(".file-tree").find('.selected')[0].textContent+'?',
    //             buttons:{
    //                 confirm:{
    //                     text:'Sí',
    //                     action:function(){
    //                         EasyLoading.show({
    //                             text:'Cargando...',
    //                             type:EasyLoading.TYPE["BALL_SCALE_RIPPLE_MULTIPLE"]
    //                         });
    //                         $.ajax({
    //                             url:'/project/deleteFolder',
    //                             type:'POST',
    //                             data:JSON.stringify({'folder_id':$(".file-tree").find('.selected').data('folder')}),
    //                             success:function(response){
    //                                 EasyLoading.hide();
    //                                 try{
    //                                     var res=JSON.parse(response);
    //                                 }catch(err){
    //                                     ajaxError():
    //                                 }
    //                                 if (res.success){
    //                                     loadTreeMenu(me.user_info['project_id']);
    //                                 }
    //                                 else{
    //                                     $.alert({
    //                                         theme:'dark',
    //                                         title:'Atención',
    //                                         content:res.msg_response
    //                                     });
    //                                 }
    //                             },
    //                             error:function(){
    //                                 $.alert({
    //                                     theme:'dark',
    //                                     title:'Atención',
    //                                     content:'Ocurrió un error, favor de intentarlo de nuevo maś tarde.'
    //                                 });
    //                             }
    //                         });
    //                     }
    //                 },
    //                 cancel:{
    //                     text:'No'
    //                 }
    //             }
    //         });
    //         $("#FIparent").val($(".file-tree").find('.selected')[0].textContent);
    //         $("#mod_add_folder").data('parent_id',$(".file-tree").find('.selected').data('folder'));
    //     }
    // });

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
                $(".file-tree").on('click','li',function(e){
                    $(".file-tree").find('a').css('background-color','');
                    $(".file-tree").find('a').removeClass('selected');
                    $(e.target.firstChild).css('background-color','lavender');
                    $(e.target.firstChild).addClass('selected');
                    if ($("#newFormFolder").is(':visible')){
                        $("#newFormFolder").val($(e.target.firstChild)[0].textContent);
                    }
                    if ($("#newFormImportFolder").is(":visible")){
                        $("#newFormImportFolder").val($(e.target.firstChild)[0].textContent);
                    }
                    // if ($(e.target.firstChild).hasClass('selected')){
                    //     $(".file-tree").find('a').css('background-color','');
                    //     $(".file-tree").find('a').removeClass('selected');
                    // }
                    // else if (!$(e.target.firstChild).hasClass('selected')){
                    //     $(".file-tree").find('a').css('background-color','');
                    //     $(".file-tree").find('a').removeClass('selected');
                    //     $(e.target.firstChild).css('background-color','lavender');
                    //     $(e.target.firstChild).addClass('selected');
                    // }
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
