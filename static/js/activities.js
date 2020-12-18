$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    var date = new Date();
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
    $("#activ_date").val(lastDay);
    $("#tableActList").DataTable();
    loadUserActivities(me.user_info.user_id,lastDay);

    $("#activ_date").on('change',function(x){
        // console.log(x.currentTarget.value);
        loadUserActivities(me.user_info.user_id,x.currentTarget.value);
    });

    $("#btnSearchUserAct").click(function(){
        loadUserActivities(me.user_info.user_id,$("#activ_date").val());
    });
});

function loadUserActivities(user_id,date){
    $("#tableActList").DataTable({
        "scrollY":"300px",
        "scrollCollapse":true,
        "lengthChange":false,
        serverSide:true,
        destroy:true,
        searching:false,
        ordering:false,
        ajax:{
            data:{'user_id':user_id,'date':date},
            url:'/activity-list/getUserActivities',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'form_name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'project_name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'resolve_before',"width":"10%", "className":"dt-center"},
            {data:'status',"width":"15%", "className":"dt-head-center dt-body-left"},
            {data:'link',"width":"5%", "className":"dt-center"}
        ]
    })
}
