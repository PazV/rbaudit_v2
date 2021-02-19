$(document).ready(function(){
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    var me = this;
    console.log(me.user_info);
    $("#dropAddFolder").click(function(){
        $("#mod_add_folder").data('mode','new');
        $("#divFIparent").css('display','flex');
        $("#mod_add_folder").find('.spn-modal-header').html('Crear carpeta');
        if ($("#div-include-fmp").children().length==0){
            $("#FIparent").val('Raíz');
            $("#mod_add_folder").data('parent_id',-1);
        }
        else{
            //es de una subcarpeta
            //obtener última subcarpeta para asignarla como parent_id
            $("#FIparent").val($("#div-include-fmp").children('.div-return-menu-subfolder').last()[0].outerText);
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
                data['project_id']=$("#aHomeMP").data('projectid');
                if ($("#div-include-fmp").children().length==0){
                    data['parent_id']=-1;
                }
                else{
                    // $("#div-include-fmp").children('.div-return-menu-subfolder').last()

                    data['parent_id']=$("#div-include-fmp").children('.div-return-menu-subfolder').last().find('a').data('folder');
                }
                // data['parent_id']=$("#mod_add_folder").data('parent_id');
                // data['project_id']=me.user_info['project_id'];
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
                        if (data['parent_id']==-1){
                            getFirstMenuFolders(data['project_id']);
                        }
                        else{
                            getSubfoldersForms(data['parent_id'],data['project_id']);
                        }
                        // loadTreeMenu(me.user_info['project_id']);
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

    $("#mod_add_folder").on('shown.bs.modal',function(){
        $("#FIname").focus();
    });

    $("#mod_add_folder").on('hide.bs.modal',function(){
        resetForm('#frmFolderInfo',['input|INPUT']);
    });
});
