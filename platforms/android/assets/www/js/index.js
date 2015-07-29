
// variables referenciales
var url = "http://didactica.pablogarin.cl";
var user;
var receptor;
var sql;
var secuencia;
var notificacion = new Notificacion();


document.addEventListener("backbutton",backButton, false);


var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
		user = window.localStorage.getItem("user");
		if( user==null ){
			$(".loader").hide();
			$("#main-content").hide();
			$("#login-container").show();
			$("#login-form").on("submit",function(e){
				e.preventDefault();
				var user = $("input[name=usuario]").val();
				var pass = $("input[name=password]").val();
				if( user.length==0 || pass.length==0 ){
					alert("Debe ingresar usuario y contraseña");
				} else {
					$.ajax({
						url:url+"/mobile/login.php",
						data:{user:user, pass:pass},
						dataType: 'json',
						type:'POST',
						success: function(resp){
							console.log(JSON.stringify(resp));
							if(resp.state==0){
								user = resp.user;
								window.localStorage.setItem("user",user);
								secuencia = 0;
								window.localStorage.setItem("secuencia",secuencia);
								app.initializeUser();
								$("#main-content").show();
								$("#login-container").hide();
							}
						},
						error: function(resp){
							console.log(JSON.stringify(resp));
						}
					});
				}
			});
		} else {
			secuencia = window.localStorage.getItem("secuencia")
			app.initializeUser();
		}
    },
	initializeUser: function(){
		// BDD
		sql = window.openDatabase("WebClassMobile", "1.0", "WebClass Educational Suite Mobile", 1024*1024*10);
		$("#btn-logout").off("click");
		$("#btn-logout").on("click",function(e){
			sql.transaction(
				function(tx){
					tx.executeSql("DROP TABLE notificacion");
				}
			);
			window.localStorage.clear();
			receptor = null;
			user = null;
			app.onDeviceReady();
		});
		app.receivedEvent('deviceready');
		$(".loader").hide();
		if( receptor==null ){
			$("#usuarios").show();
			$("#chat").hide();
			$.ajax({
				url:url+"/gcm/list-users.php",
				data:{user:user},
				dataType:'json',
				type:'POST',
				success:function(resp){
					console.log(JSON.stringify(resp));
					$("#usuarios").html("");
					for( var id in resp.usuarios ){
						app.addUser(resp.usuarios[id]);
					}
					$(".usuario").on("click",function(e){
						e.preventDefault();
						receptor = $(this).attr("data-rel");
						app.initializeUser();
					});
				},
				error:function(resp){
					console.log(JSON.stringify(resp));
				}
			});
		} else {
			$("#usuarios").hide();
			$("#chat").show();
			notificacion.createTable(sql);
			$.ajax({
				url : url+'/gcm/getMessages.php',
				data: {user:user},
				type:'POST',
				dataType:'json',
				success: function(result){
					console.log(JSON.stringify(result));
					if(result.status==0){
						for( var id in result.messages ){
							var mes = result.messages[id];
							console.log(JSON.stringify(mes));
							if( mes.secuencia>secuencia ){
								secuencia = mes.secuencia;
							}
							notificacion.insert(sql,mes,function(){
								window.localStorage.setItem("secuencia",secuencia);
								//continue;
							});
						}
						notificacion.select(sql,receptor,function(mensajes){
							$("ul#chat-window").html("");
							for( var id in mensajes ){
								var mes = mensajes[id];
								console.log(JSON.stringify(mes));
								var data = {
									user : mes.remitente,
									time : mes.fecha,
									message : mes.mensaje
								};
								app.addMessage(data);
							}
						});
					} else {
						console.log(result.errormessage);
					}
				},
				error: function(result){
					console.log(JSON.stringify(result));
				}
			});
			$("#btn-enviar").off("click");
			$("#btn-enviar").on("click",function(e){
				var message = $("#inp-message").val();
				if( message.length>0 ){
					$.ajax({
						url:url+"/gcm/send.php?push=true",
						data:{remitente:user,receptor:receptor,message:message},
						type:'POST',
						dataType:'json',
						success:function(resp){
							console.log(JSON.stringify(resp));
							$("#inp-message").val("");
							app.addMessage(resp.data);
						}
					});
				}
			});
		}
	},
    // Update DOM on a Received Event
    receivedEvent: function(id) {
		// PUSH
		var pushNotification = window.plugins.pushNotification;
		pushNotification.register(app.successHandler, app.errorHandler,{"senderID":"729453770855","ecb":"app.onNotificationGCM","alert":"true","sound":"true","badge":"true"});
    },
	successHandler: function(result){
	},
	errorHandler: function(error){
		alert(error);
	},
	onNotificationGCM: function(e) {
		console.log(JSON.stringify(e));
		switch( e.event )
		{
		case 'registered':
			if ( e.regid.length > 0 )
			{
				console.log("Regid " + e.regid);
				var data = {
					user : user, // FIXME: mandar la id del usuario actual
					id: e.regid
				}
				$.ajax({
					url : url+'/saveDeviceId.php',
					data : data,
					type: 'POST',
					dataType: 'json',
					success : function(resp){
						$(".loader").hide();
						console.log('Id grabada');
					}, 
					error : function(resp,error){
						alert('error:'+error);
					}
				});
			}
			break;
		case 'message':
			$.ajax({
				url : url+'/gcm/getMessages.php',
				data : {user:user},
				dataType : 'json',
				type : 'POST',
				success : function(result){
					if(result.status==0){
						for( var id in result.messages ){
							var mes = result.messages[id];
							if( mes.secuencia>secuencia ){
								secuencia = mes.secuencia;
							}
							console.log(JSON.stringify(mes));
							notificacion.insert(sql,mes,function(){
								window.localStorage.setItem("secuencia",secuencia);
							});
						}
						notificacion.select(sql,receptor,function(mensajes){
							$("ul#chat-window").html("");
							for( var id in mensajes ){
								var mes = mensajes[id];
								console.log(JSON.stringify(mes));
								var data = {
									user : mes.remitente,
									time : mes.fecha,
									message : mes.mensaje
								};
								app.addMessage(data);
							}
						});
					}
				},
				error : function(resp){
				},
			});
			break;
		case 'error':
			alert('GCM error = '+e.msg);
			break;
		default:
			alert('An unknown GCM event has occurred');
			break;
		}
	},
	addMessage: function(data){
		if( data.user!=user ){
			var source = $("#incoming-chat").html();
		} else {
			var source = $("#outgoing-chat").html();
		}
		var t = (data.time).split(/[- :]/);
		data.time = timeSince(new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
		var template = Handlebars.compile(source);
		var result = template(data);
		$("#chat-window").append(result);
		$("*").scrollTop($("#messages").height());
	},
	addUser: function(data){
		var source = $("#usuario-div").html();
		var template = Handlebars.compile(source);
		var result = template(data);
		$("#usuarios").append(result);
	}
};


function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);
    if (interval > 1) {
        return interval + " años";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " meses";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " dias";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " horas";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutos";
    }
    return Math.floor(seconds) + " segundos";
}
function backButton(){
	if( receptor!=null ){
		receptor = null;
		app.initializeUser();
		return;
	}
	navigator.app.exitApp();
}
