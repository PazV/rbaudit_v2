$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    $("#btnGotoFormStep2").click(function(){
        $("#frmCreateformStep1 :input").focusout();
        var form_input=$("#frmCreateformStep1 .form-control");
        var valid=true;
        for (var x in form_input){
            console.log(form_input[x].id);
            if ($("#"+form_input[x].id).hasClass('invalid-field')){
                valid=false;
                break
            }
        }
        if (valid===true){
            var data=getForm("#frmCreateformStep1");
            data['user_id']=me.user_info['user_id'];
            data['project_id']=me.user_info['project_id'];
            data['form_id']=-1;
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
                        console.log(me.user_info);
                        window.location.pathname='/project/'+me.user_info.project_factor+'/createform/step-2/'+res.form_id;
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


});
