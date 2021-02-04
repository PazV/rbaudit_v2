$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    var date = new Date();
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
    $("#activ_date").val(lastDay);
    $("#tableActList").DataTable();
    // loadUserActivities(me.user_info.user_id,lastDay);
    loadUserActivities(me.user_info.user_id,[]);
    // console.log(this.user_info);
    $("#activ_date").on('change',function(x){
        // console.log(x.currentTarget.value);
        // loadUserActivities(me.user_info.user_id,x.currentTarget.value);
        loadUserActivities(me.user_info.user_id,[]);
    });

    $("#btnSearchUserAct").click(function(){
        // loadUserActivities(me.user_info.user_id,$("#activ_date").val());
        loadUserActivities(me.user_info.user_id,[]);
    });

    $("#actFilterType").on('change',function(){
        $("#divActFilterInput").empty();
        var selected=$("option:selected", this);
        var sel_name=$(selected).data('name');
        
        if ($(selected).data('type')=='text'){
            $("#divActFilterInput").append('<input type="text" class="form-control form-control-sm" id="textTypeActFilter" placeholder="'+$(selected).html()+'">');
        }
        if ($(selected).data('type')=='date') {
            $("#divActFilterInput").append('<label class="col-form-label-sm" for="actFilterDateFrom">De:</label><input type="date" class="form-control form-control-sm" id="actFilterDateFrom"><label class="col-form-label-sm" for="actFilterDateTo">Hasta:</label><input type="date" class="form-control form-control-sm" id="actFilterDateTo">')
        }
        if ($(selected).data('type')=='select'){
            $("#divActFilterInput").append('<select id="selActFilterStatus" class="form-control form-control-sm"><option value="3">Publicado</option><option value="4">Resolviendo</option><option value="5">Enviado a revisión</option><option value="6">Revisando</option><option value="7">Cerrado</option></select>');
        }
        $("#btnActFilterSearch").css("display","initial");


    });


    $("#btnActFilterSearch").click(function(){
        var type=$("option:selected", $("#actFilterType")).data('type');
        var sel_name=$("option:selected", $("#actFilterType")).data('name');
        if (type=='text'){
            $(".div-act-filters-container").append('<div class="div-act-filters-content" data-name="'+sel_name+'" data-val="'+$("#textTypeActFilter").val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button>'+$("#textTypeActFilter").val()+'</div>');
        }
        if (type=='date'){
            $(".div-act-filters-container").append('<div class="div-act-filters-content" data-name="'+sel_name+'" data-val="'+$("#actFilterDateFrom").val()+','+$("#actFilterDateTo").val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button>'+$("#actFilterDateFrom").val()+' - '+$("#actFilterDateTo").val()+'</div>');
        }
        if (type=='select'){
            $(".div-act-filters-container").append('<div class="div-act-filters-content" data-name="'+sel_name+'" data-val="'+$("option:selected",$("#selActFilterStatus")).val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button>'+$("option:selected",$("#selActFilterStatus"))[0].innerText+'</div>');
        }

        $(".btn-destroy-act-filter-content").click(function(){
            console.log($(this));
            $(this).parent('div .div-act-filters-content').remove();
            var filters=$(".div-act-filters-content");
            loadUserActivities(me.user_info.user_id,filters);
        });

        var filters=$(".div-act-filters-content");
        loadUserActivities(me.user_info.user_id,filters);


    });

});

function loadUserActivities(user_id,filters){

    filter_list=[];
    for (var x of filters){
        filter_list.push({'field':$(x).data('name'),'value':$(x).data('val')});
    }

    $("#tableActList").DataTable({
        "scrollY":"250px",
        "scrollCollapse":true,
        "lengthChange":false,
        serverSide:true,
        destroy:true,
        searching:false,
        ordering:false,
        ajax:{
            data:{'user_id':user_id,'filters':JSON.stringify(filter_list)},
            url:'/activity-list/getUserActivities',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'company_name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'form_name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'resolve_before',"width":"10%", "className":"dt-center"},
            {data:'status',"width":"15%", "className":"dt-head-center dt-body-left"},
            {data:'link',"width":"5%", "className":"dt-center"}
        ]
    })
}
