$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    $("#btnOpenNotifications").click(function(){
        $("#btnOpenNotifications").children().removeClass('bell-notif').addClass('bell-no-notif');
    });

    if (window.location.pathname.includes('/notifications/')){
        $("#btnOpenNotifications").children().removeClass('bell-notif').addClass('bell-no-notif');
        getNotifications(me.user_info);
    }
});

function getNotifications(user_info){
    $.ajax({
        url:'/notifications/getNotifications',
        type:'POST',
        data:JSON.stringify({
            'user_id':user_info['user_id'],
            'project_id':user_info['project_id']
        }),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divNotificationList").empty();
                for (var x of res.data){
                    $("#divNotificationList").append(x);
                    $(".notif").on('click',function(){
                        $(".notif").removeClass('selected-notif');
                        $(this).addClass('selected-notif');
                        showNotification(this);
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
        error:function(){
            $.alert({
                theme:'dark',
                title:'Atención',
                content:'Ocurrió un erorr, favor de intentarlo de nuevo.'
            });
        }
    });
}

function showNotification(element){
    $.ajax({
        url:'/notifications/showNotification',
        type:'POST',
        data:JSON.stringify({'notification_id':$(element).data('notif')}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError();
            }
            if (res.success){
                $("#divNotificationContent").empty();
                $("#divNotificationContent").append(res.data);
                if ($(element).hasClass('unread-notif')){
                    $(element).removeClass('unread-notif').addClass('read-notif');
                    if ($($(element).find('i')).hasClass('fa fa-envelope')){
                        $($(element).find('i')).removeClass('fa fa-envelope').addClass('fa fa-envelope-open');
                    }
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
