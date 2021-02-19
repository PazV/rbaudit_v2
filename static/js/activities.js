$(document).ready(function(){
    var me = this;
    this.user_info=JSON.parse($("#spnSession")[0].textContent);
    var date = new Date();
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];

    $("#tableActList").DataTable();

    if (window.location.pathname.includes('/activity-list/consultant')){
        //cargar espacios de trabajo
        getConsultWorkspaces(me.user_info,true,'activity_list');
    }
    else{
        loadUserActivities(me.user_info.user_id,[]);
    }

    $("#actFilterType").on('change',function(){
        $("#divActFilterInput").empty();
        var selected=$("option:selected", this);
        var sel_name=$(selected).data('name');

        if ($(selected).data('type')=='text'){
            $("#divActFilterInput").append('<input type="text" class="form-control form-control-sm" id="textTypeActFilter" placeholder="'+$(selected).html()+'">');
        }
        if ($(selected).data('type')=='date') {
            $("#divActFilterInput").append('<label class="col-form-label-sm" for="actFilterDateFrom" style="margin-right:3px;">De:</label><input type="date" class="form-control form-control-sm" id="actFilterDateFrom" style="margin-right:3px;"><label class="col-form-label-sm" for="actFilterDateTo" style="margin-right:3px;">Hasta:</label><input type="date" class="form-control form-control-sm" id="actFilterDateTo">')
        }
        if ($(selected).data('type')=='select'){
            if ($(selected).data('name')=='status'){
                $("#divActFilterInput").append('<select id="selActFilterStatus" class="form-control form-control-sm"><option value="3">Sin iniciar</option><option value="4">Resolviendo</option><option value="5">Enviado a revisión</option><option value="6">Revisando</option><option value="7">Cerrado</option></select>');
            }
            if ($(selected).data('name')=='priority'){
                $("#divActFilterInput").append('<select id="selActFilterPriority" class="form-control form-control-sm"><option value="red">Rojo</option><option value="orange">Naranja</option><option value="yellow">Amarillo</option></select>');
            }
        }
        $("#btnActFilterSearch").css("display","initial");


    });


    $("#btnActFilterSearch").click(function(){

        var type=$("option:selected", $("#actFilterType")).data('type');
        var sel_name=$("option:selected", $("#actFilterType")).data('name');
        if (type=='text'){
            if ($("#textTypeActFilter").val().trim().length>0){
                // $(".div-act-filters-container").append('<div class="div-act-filters-content" data-name="'+sel_name+'" data-val="'+$("#textTypeActFilter").val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button>'+$("#textTypeActFilter").val()+'</div>');

                ///////////////////////////////con nombre de actividad
                $(".div-act-filters-container").append('<div class="div-act-filters-content row row-wo-margin" data-name="'+sel_name+'" data-val="'+$("#textTypeActFilter").val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button><div style="line-height:1; margin-left:3px;"><div style="color:gray; text-align:center;">'+$("option:selected", $("#actFilterType")).html()+'</div><div style="text-align:center;"> '+$("#textTypeActFilter").val()+'</div></div>');

                $("#textTypeActFilter").val("");
            }
            else{
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Debes escribir algo en el campo de búsqueda.'
                });
            }

        }
        if (type=='date'){
            if ($("#actFilterDateFrom").val()=="" || $("#actFilterDateTo").val()==""){
                $.alert({
                    theme:'dark',
                    title:'Atención',
                    content:'Debes seleccionar una fecha para ambos campos de búsqueda.'
                });
            }
            else{
                if ($("#actFilterDateTo").val()>=$("#actFilterDateFrom").val()){
                    // $(".div-act-filters-container").append('<div class="div-act-filters-content" data-name="'+sel_name+'" data-val="'+$("#actFilterDateFrom").val()+','+$("#actFilterDateTo").val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button>'+$("#actFilterDateFrom").val()+' - '+$("#actFilterDateTo").val()+'</div>');

                    /////////////// con nombre de actividad
                    $(".div-act-filters-container").append('<div class="div-act-filters-content row row-wo-margin" data-name="'+sel_name+'" data-val="'+$("#actFilterDateFrom").val()+','+$("#actFilterDateTo").val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button><div style="line-height:0.9; margin-left:3px;"><div style="color:gray; text-align:center;">Vencimiento</div><div style="text-align:center;">'+$("#actFilterDateFrom").val()+' - '+$("#actFilterDateTo").val()+'</div></div>');


                    $("#actFilterDateFrom").val("");
                    $("#actFilterDateTo").val("");




                }
                else{
                    $.alert({
                        theme:'dark',
                        title:'Atención',
                        content:'La fecha del campo <b>hasta</b> debe ser mayor o igual a la del campo <b>de</b>.'
                    });
                }
            }
        }
        if (type=='select'){
            // $(".div-act-filters-container").append('<div class="div-act-filters-content" data-name="'+sel_name+'" data-val="'+$("option:selected",$("#selActFilterStatus")).val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button>'+$("option:selected",$("#selActFilterStatus"))[0].innerText+'</div>');

            //////////////////con nombre de actividad
            if (sel_name=='status'){
                $(".div-act-filters-container").append('<div class="div-act-filters-content row row-wo-margin" data-name="'+sel_name+'" data-val="'+$("option:selected",$("#selActFilterStatus")).val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button><div style="line-height:0.9; margin-left:3px;"><div style="color:gray; text-align:center;">Estado</div><div style="text-align:center;">'+$("option:selected",$("#selActFilterStatus"))[0].innerText+'</div></div>');
            }
            if (sel_name=='priority'){
                $(".div-act-filters-container").append('<div class="div-act-filters-content row row-wo-margin" data-name="'+sel_name+'" data-val="'+$("option:selected",$("#selActFilterPriority")).val()+'"><button class="btn btn-sm btn-destroy-act-filter-content"><i class="fa fa-times"></i></button><div style="line-height:0.9; margin-left:3px;"><div style="color:gray; text-align:center;">Prioridad</div><div style="text-align:center;">'+$("option:selected",$("#selActFilterPriority"))[0].innerText+'</div></div>');
            }

        }

        $(".btn-destroy-act-filter-content").click(function(){

            $(this).parent('div .div-act-filters-content').remove();
            var filters=$(".div-act-filters-content");
            loadUserActivities(me.user_info.user_id,filters);
            if ($(".div-act-filters-container").children().length==0){
                $(".div-act-filters-container").css("display","none");
            }
        });

        if ($(".div-act-filters-container").children().length>0){
            $(".div-act-filters-container").css("display","flex");
        }


        var filters=$(".div-act-filters-content");
        loadUserActivities(me.user_info.user_id,filters);


    });

    $("#actListConsultWorkspace").on('change',function(){
        var selected=$("option:selected", this);
        var sel_value=$(selected).attr('name');
        loadWorkspaceActivities(me.user_info.user_id,[],sel_value);
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
            {data:'priority_class',"width":"5%", "className":"dt-head-center dt-body-center"},
            {data:'company_name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'form_name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'resolve_before',"width":"10%", "className":"dt-center"},
            {data:'status',"width":"15%", "className":"dt-head-center dt-body-left"},
            {data:'link',"width":"5%", "className":"dt-center"}
        ]
    })
}

function loadWorkspaceActivities(user_id,filters,workspace_id){

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
            data:{'user_id':user_id,'filters':JSON.stringify(filter_list),'workspace_id':workspace_id},
            url:'/activity-list/getWorkspaceActivities',
            dataSrc:'data',
            type:'POST',
            error:ajaxError,
        },
        columns:[
            {data:'priority_class',"width":"5%", "className":"dt-head-center dt-body-center"},
            {data:'company_name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'form_name',"width":"35%", "className":"dt-head-center dt-body-left"},
            {data:'resolve_before',"width":"10%", "className":"dt-center"},
            {data:'status',"width":"15%", "className":"dt-head-center dt-body-left"},
            {data:'link',"width":"5%", "className":"dt-center"}
        ]
    })
}

function getConsultWorkspaces(user_info,is_first,template){
    //el segundo parámetro sirve para saber si es la primera vez que se carga el select, para también mandar a llamar los proyectos en cuanto termina la petición ajax de los espacios de trabajo, se obtendrán los proyectos del último espacio de trabajo regresado en orden alfabético
    if (template=='activity_list'){
        var sel_id="#actListConsultWorkspace";
    }
    if (template=='my_projects'){
        var sel_id="#myProjectsConsultWorkspace";
    }
    $.ajax({
        url:'/project/getConsultantWorkspaces',
        type:'POST',
        data:JSON.stringify({'user_id':user_info.user_id}),
        success:function(response){
            try{
                var res=JSON.parse(response);
            }catch(err){
                ajaxError()
            }
            if (res.success){
                $.each(res.data,function(i,item){
                    $(sel_id).append($('<option>',{
                        text:item.name,
                        name:item.workspace_id,
                        selected:true
                    }));
                });
                if (is_first===true){

                    var ws_len=res.data.length;
                    if (template=='activity_list'){
                        loadWorkspaceActivities(user_info.user_id,[],res.data[ws_len-1]['workspace_id']);
                    }
                    if (template=='my_projects'){
                        getWorkspaceProjects(user_info,res.data[ws_len-1]['workspace_id'],'')
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
