
// variables referenciales
var url = "http://didactica.pablogarin.cl";
var user;
var receptor;
var sql;
var secuencia;
var notificacion = new Notificacion();


document.addEventListener("backbutton",backButton, false);
$("#tabs-usuarios li, #tabs-usuarios a").off("click");
$("#tabs-usuarios li, #tabs-usuarios a").on("click",function(e){
	e.preventDefault();
	$("#tabs-usuarios li").removeClass("active");
	$(this).addClass("active");
});

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
			$(".hide-login").hide();
			$("#login-container").show();
			$("#login-form").on("submit",function(e){
				e.preventDefault();
				var userLogin = $("input[name=usuario]").val();
				var passLogin = $("input[name=password]").val();
				if( userLogin.length==0 || passLogin.length==0 ){
					navigator.notification.alert("Debe ingresar su usuario y clave",function(){ $("input[name=usuario]").focus(); },"Error");
				} else {
					$(".loader").show();
					$.ajax({
						url:url+"/mobile/login.php",
						data:{user:userLogin, pass:passLogin},
						dataType: 'json',
						type:'POST',
						success: function(resp){
							$(".loader").hide();
							if(resp.state==0){
								user = resp.user;
								window.localStorage.setItem("user",user);
								secuencia = 0;
								window.localStorage.setItem("secuencia",secuencia);
								app.initializeUser();
							} else {
								navigator.notification.alert("Error: \n"+resp.message,function(){ $("input[name=passrowd]").val(""); $("input[name=usuario]").focus() },"Login");
							}
						},
						error: function(resp){
							$(".loader").hide();
							navigator.notification.alert("No se puede procesar su solicitud en estos momentos, por favor intentelo nuevamente más adelante.",function(){},"Error");
							console.log(JSON.stringify(resp));
						}
					});
				}
			});
		} else {
			app.initializeUser();
		}
    },
	initializeUser: function(){
		// BDD
		sql = window.openDatabase("WebClassMobile", "1.0", "WebClass Educational Suite Mobile", 1024*1024*10);
		secuencia = window.localStorage.getItem("secuencia")
		app.populateUsers();
		$("#login-container").hide();
		$(".hide-login").show();
		$("#main-content").show();
		var contacto = new Contacto();
		contacto.createTable(sql);
		notificacion.createTable(sql);
		app.downloadMessages();
		$("#btn-logout").off("click");
		$("#btn-logout").on("click",function(e){
			var pushNotification = window.plugins.pushNotification;
			pushNotification.unregister(
			function(){
				app.setTitle();
				sql.transaction(
					function(tx){
						tx.executeSql("DROP TABLE notificacion");
						tx.executeSql("DROP TABLE contacto");
					}
				);
				window.localStorage.clear();
				receptor = null;
				user = null;
				app.onDeviceReady();
			}, function(){
				navigator.notification.alert("No se pudo realizar la acción",null,"Error");
			});
		});
		app.setTitle();
		app.receivedEvent('deviceready');
		$(".loader").hide();
		if( receptor==null ){
			$("#usuarios").show();
			$("#chat").hide();
			app.populateUsers();
		} else {
			$(".loader").show();
			$("#usuarios").hide();
			$("#chat").show();
			app.populateMessages();
			$("#inp-message").on("focus",function(){
				app.readMessages();
			});
			$("#btn-enviar").off("click");
			$("#btn-enviar").on("click",function(e){
				$(".loader").show();
				var message = $("#inp-message").val();
				if( message.length>0 || message!='' ){
					var dt = new Date();
					var fecha = dt.getFullYear()+"-"+((dt.getMonth()+1)<10?'0'+(dt.getMonth()+1):(dt.getMonth()+1))+'-'+(dt.getDate()<10?'0'+dt.getDate():dt.getDate())+' '+(dt.getHours()<10?'0'+dt.getHours():dt.getHours())+':'+(dt.getMinutes()<10?'0'+dt.getMinutes():dt.getMinutes())+':'+(dt.getSeconds()<10?'0'+dt.getSeconds():dt.getSeconds());
					var postData = {
						remitente:user,
						receptor:receptor,
						message:message,
						fecha:fecha
					};
					$.ajax({
						url:url+"/gcm/send.php?push=true",
						data:postData,
						type:'POST',
						dataType:'json',
						success:function(resp){
							$(".loader").hide();
							$("#inp-message").val("");
							resp.data.class = "fa fa-ellipsis-h";
							app.addMessage(resp.data);
						},
						error: function(){
							navigator.notification.alert("No se pudo enviar el mensaje",function(){ $("#inp-message").focus(); },"Error");
							$(".loader").hide();
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
				var data = {
					user : user, // FIXME: mandar la id del usuario actual
					id: e.regid
				}
				$.ajax({
					url : url+'/saveDeviceId.php',
					data : data,
					type: 'POST',
					success : function(resp){
						$(".loader").hide();
					}, 
					error : function(resp,error){
						console.log(JSON.stringify(resp));
					}
				});
			}
			break;
		case 'message':
			if( e.payload.read=='true' || e.payload.read ){
				if( e.payload.receptor==receptor ){
					$(".fa.fa-ellipsis-h").removeClass("fa-ellipsis-h").addClass("fa-check");
				}
				var n = new Notificacion();
				n.readMessages(sql,user,e.payload.receptor);
			} else {
				if( e.coldstart ){
					receptor = e.payload.usuario;
					app.initializeUser();
					return;
				}
				var params = {
					user : user,
					secuencia : secuencia,
					leer:true
				};
				$.ajax({
					url : url+'/gcm/getMessages.php',
					data : params,
					type : 'POST',
					dataType : 'json',
					success : function(result){
						if(result.status==0){
							for( var id in result.messages ){
								var mes = result.messages[id];
								if( parseInt(mes.secuencia)>parseInt(secuencia) ){
									secuencia = mes.secuencia;
								}
								var n = new Notificacion();
								n.insert(sql,mes,function(){
								});
							}
							window.localStorage.setItem("secuencia",secuencia);
						}
						if(receptor!=null){
							app.populateMessages();
						} else {
							app.populateUsers();
						}
					},
					error : function(resp){
						$(".loader").hide();
					},
				});
			}
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
		if(typeof data.ultimafecha==='string'){
			var t = (data.ultimafecha).split(/[- :]/);
			data.time = timeSince(new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
		} else {
			data.time = 'Nunca';
		}
		if(data.ultimomensaje!=null){
			data.mensaje = (data.ultimomensaje).substr(0, 10) + "\u2026";
		} else {
			data.mensaje = '';
		}
		var source = $("#usuario-div").html();
		var template = Handlebars.compile(source);
		var result = template(data);
		$("#lista-usuarios").append(result);
	},
	populateMessages: function(){
		app.downloadMessages();
		app.readMessages();
		app.setTitle();
		notificacion.select(sql,receptor,function(mensajes){
			$("ul#chat-window").html("");
			for( var id in mensajes ){
				var mes = mensajes[id];
				var data = {
					id : mes.id,
					user : mes.remitente,
					time : mes.fecha,
					message : mes.mensaje,
					class : (mes.leido?'fa fa-check':'fa fa-ellipsis-h')
				};
				app.addMessage(data);
			}
			$(".loader").hide();
		});
	},
	populateUsers: function(){
		if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
			var data = {
				user:user
			};
			$.ajax({
				url:url+"/gcm/list-users.php",
				data:data,
				dataType:'json',
				type:'POST',
				success:function(resp){
					for( var id in resp.usuarios ){
						var c = new Contacto();
						c.insert(sql,resp.usuarios[id]);
					}
				},
				error:function(resp){
					console.log(JSON.stringify(resp));
				}
			});
		}
		var c = new Contacto();
		c.select(sql,null,function(contactos){
			$("#lista-usuarios").html("");
			for( var id in contactos ){
				app.addUser(contactos[id]);
			}
			$(".usuario").off("click");
			$(".usuario").on("click",function(e){
				$(".loader").show();
				$("#chat-window").html("");
				e.preventDefault();
				receptor = $(this).attr("data-rel");
				app.initializeUser();
				$(".loader").hide();
			});
		});
	},
	downloadMessages: function(){
		console.log("downloadMessages");
		var params = {
			user : user,
			secuencia : secuencia
		}
		console.log(JSON.stringify(params));
		if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
			console.log("has connection");
			$.ajax({
				url : url+'/gcm/getMessages.php',
				data : params,
				type : 'POST',
				dataType : 'json',
				success : function(result){
					console.log(JSON.stringify(result));
					if(result.status==0){
						for( var id in result.messages ){
							var mes = result.messages[id];
							if( parseInt(mes.secuencia)>parseInt(secuencia) ){
								secuencia = mes.secuencia;
							}
							var n = new Notificacion();
							n.insert(sql,mes,function(){
							});
						}
						window.localStorage.setItem("secuencia",secuencia);
					} else {
						console.log(result.errormessage);
					}
				},
				error: function(result){
					$(".loader").hide();
					console.log(JSON.stringify(result));
				}
			});
		}
	},
	readMessages: function(){
		var params = {
			receptor: user,
			remitente:receptor
		}
		$.ajax({
			url : url+"/gcm/read.php",
			data: params,
			type: 'POST',
			success: function(r){
			},
			error: function(e,error){
				console.log(JSON.stringify(e));
				console.log(error);
			}
		});
	},
	setTitle: function(){
		var tDom = $("#titulo");
		if( receptor!=null ){
			var c = new Contacto();
			var title = '';
			var filter = " WHERE id='"+receptor+"'";// DEJAR SIEMPRE ESPACIO AL INICIO
			c.select(sql,filter,function(result){
				for( var id in result ){
					var cObj = result[id];
					if( typeof cObj !== 'undefined' ){
						tDom.html("<a href='#' onclick='backButton(); return false;' class='pull-left'><i class='fa fa-angle-left fa-2x'></i></a>");
						var foto = new Image();
						foto.src = cObj.foto;
						foto.className = "img-circle img-responsive"
						tDom.append(foto);
						tDom.append(cObj.nombre+" "+cObj.apellido);
					}
				}
			});
		} else {
			tDom.html("WebClass");
		}
	}
};

function formatAMPM(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}
function timeSince(date) {
	var retval = "Hace ";
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
		retval += interval + " año";
		if( interval>1 ){
			retval+="s";
		}
        return retval;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
		retval += interval + " mes";
		if( interval>1 ){
			retval+="es";
		}
        return retval;
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
		retval += interval + " día";
		if( interval>1 ){
			retval+="s";
		}
        return retval;
    }
	return formatAMPM(date);
	/*
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " horas";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutos";
    }
    return Math.floor(seconds) + " segundos";
	//*/
}
function backButton(){
	if( receptor!=null ){
		receptor = null;
		app.initializeUser();
		return;
	}
	navigator.app.exitApp();
}
