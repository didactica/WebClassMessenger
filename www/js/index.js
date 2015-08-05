
// variables referenciales
var url = "http://didactica.pablogarin.cl";
var user;
var receptor;
var sql;
var secuencia;
var notificacion = new Notificacion();
var buscar = false;
var filtroUsuario = null;
var tab = "chats";

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
			// CREACION DE TABLAS
			sql = window.openDatabase("WebClassMobile", "1.0", "WebClass Educational Suite Mobile", 1024*1024*10);
			var o = new Contacto();
			o.createTable(sql);
			var o = new Chat();
			o.createTable(sql);
			var o = new ChatContacto();
			o.createTable(sql);
			var o = new Notificacion();
			o.createTable(sql);
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
					navigator.notification.activityStart("Identificando","Comprobando datos...");
					$.ajax({
						url:url+"/mobile/login.php",
						data:{user:userLogin, pass:passLogin, nocolegios:true},
						dataType: 'json',
						type:'POST',
						success: function(resp){
							navigator.notification.activityStop();
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
							navigator.notification.activityStop();
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
						console.log("DELETING TABLES");
						tx.executeSql("delete from chat",null,null,function(tx,error){ console.log(JSON.stringify(error)); });
						tx.executeSql("delete from chat_contacto",null,null,function(tx,error){ console.log(JSON.stringify(error)); });
						tx.executeSql("delete from contacto",null,null,function(tx,error){ console.log(JSON.stringify(error)); });
						tx.executeSql("delete from mensaje_chat",null,null,function(tx,error){ console.log(JSON.stringify(error)); });
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
		if( receptor==null ){
			$("#lista-usuarios").html("");
			$("#tabs-usuarios ul.nav.nav-tabs li").removeClass("active");
			switch(tab){
				case 'usuarios':
					navigator.notification.activityStart("Cargando", "Cargando lista de usuarios");
					$("#tabs-usuarios ul.nav.nav-tabs li a[href='#usuarios']").parents('li').addClass("active");
					break;
				case 'grupos':
					navigator.notification.activityStart("Cargando", "Cargando grupos");
					$("#tabs-usuarios ul.nav.nav-tabs li a[href='#grupos']").parents('li').addClass("active");
					break;
				case 'chats':
					navigator.notification.activityStart("Cargando", "Cargando chats");
					$("#tabs-usuarios ul.nav.nav-tabs li a[href='#chats']").parents('li').addClass("active");
					break;
			}
			filtroUsuario = null;
			$("#tabs-usuarios ul li").off("click");
			$("#tabs-usuarios ul li").on("click",function(e){
				e.preventDefault();
				var action = ($($(this).find('a')).attr("href")).substr(1);
				tab = action;
				app.initializeUser();
			});
			$("#usuarios").show();
			$("#chat").hide();
			$("#buscar-usuario").show();
			$("#buscar-usuario").off("click");
			$("#buscar-usuario").on("click",function(){
				buscar = true;
				$("#tabs-usuarios").hide();
				$(".heading").hide();
				$("#search-group").show();
				$("#lista-usuarios").css({marginTop:'0px'});
				$("#search-query").focus();
				$("#search-query").on("keyup",function(e){
					if( e.keyCode==13 ){
						var query = $(this).val();
						filtroUsuario = null;
						if(query.length>0){
							filtroUsuario = " where lower(nombre) like '%"+query+"%' or lower(apellido) like '%"+query+"%'";
						}
						app.populateUsers();
					}
				});
			});
			app.populateUsers();
		} else {
			navigator.notification.activityStart("Cargando", "Cargando mensajes");
			$("#usuarios").hide();
			$("#chat").show();
			$("#buscar-usuario").hide();
			app.populateMessages();
			$("#inp-message").on("focus",function(){
				$("*").scrollTop($("#messages").height());
				app.readMessages();
			});
			$("#btn-enviar").off("click");
			$("#btn-enviar").on("click",function(e){
				var message = $("#inp-message").val();
				if( message.length>0 || message!='' ){
					navigator.notification.activityStart("Enviando","Enviando mensaje...");
					var dt = new Date();
					var fecha = dt.getFullYear()+"-"+((dt.getMonth()+1)<10?'0'+(dt.getMonth()+1):(dt.getMonth()+1))+'-'+(dt.getDate()<10?'0'+dt.getDate():dt.getDate())+' '+(dt.getHours()<10?'0'+dt.getHours():dt.getHours())+':'+(dt.getMinutes()<10?'0'+dt.getMinutes():dt.getMinutes())+':'+(dt.getSeconds()<10?'0'+dt.getSeconds():dt.getSeconds());
					var postData = {
						remitente:user,
						chat:receptor,
						message:message,
						fecha:fecha
					};
					$.ajax({
						url:url+"/gcm/send.php?push=true",
						data:postData,
						type:'POST',
						dataType:'json',
						success:function(resp){
							navigator.notification.activityStop();
							$("#inp-message").val("");
							resp.data.class = "fa fa-ellipsis-h";
							app.addMessage(resp.data);
						},
						error: function(resp,error){
							console.log(JSON.stringify(resp));
							console.log(error);
							navigator.notification.activityStop();
							navigator.notification.alert("No se pudo enviar el mensaje",function(){ $("#inp-message").focus(); },"Error");
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
						console.log(resp);
					}, 
					error : function(resp,error){
						console.log(JSON.stringify(resp));
					}
				});
			}
			break;
		case 'message':
			if( e.payload.read=='true' || e.payload.read ){
				console.log("receptor:"+receptor+"; e.payload.chat:"+e.payload.chat);
				if( e.payload.chat==receptor ){
					$(".fa.fa-ellipsis-h").removeClass("fa-ellipsis-h").addClass("fa-check");
				}
				var n = new Notificacion();
				n.readMessages(sql,user,e.payload.chat);
			} else {
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
						if( e.coldstart ){
							receptor = e.payload.chat;
							app.initializeUser();
						}
						if(receptor!=null){
							app.populateMessages();
						} else {
							app.populateUsers();
						}
					},
					error : function(resp){
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
		console.log(data);
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
	addChat: function(data){
		if(typeof data.ultimafecha==='string'){
			var t = (data.ultimafecha).split(/[- :]/);
			data.time = timeSince(new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
		} else {
			data.time = 'Nunca';
		}
		if(data.ultimomensaje!=null){
			if( (data.ultimomensaje).length>25 ){
				data.mensaje = (data.ultimomensaje).substr(0, 25) + "\u2026";
			} else {
				data.mensaje = data.ultimomensaje;
			}
		} else {
			data.mensaje = '';
		}
		var source = $("#chat-div").html();
		var template = Handlebars.compile(source);
		var result = template(data);
		$("#lista-usuarios").append(result);
	},
	addUser: function(data){
		var source = $("#usuario-div").html();
		var template = Handlebars.compile(source);
		var result = template(data);
		$("#lista-usuarios").append(result);
	},
	populateMessages: function(){
		if( buscar ){
			buscar = false;
			$("#tabs-usuarios").show();
			$(".heading").show();
			$("#search-group").hide();
			$("#lista-usuarios").css({marginTop:'3em'});
		}
		$("#search-query").val("");
		filtroUsuario = null;
		app.downloadMessages(function(){
			app.readMessages();
			app.setTitle();
			notificacion.select(sql,receptor,function(mensajes){
				$("ul#chat-window").html("");
				for( var id in mensajes ){
					var mes = mensajes[id];
					console.log(JSON.stringify(mes));
					var data = {
						id : mes.id,
						user : mes.remitente,
						time : mes.fecha,
						message : mes.mensaje,
						class : (mes.leido?'fa fa-check':'fa fa-ellipsis-h')
					};
					if( typeof mes.titulo !== 'undefined' && tab=='grupos' ){
						data.color = textToColor(mes.titulo);
						data.titulo = mes.titulo;
					}
					app.addMessage(data);
				}
				navigator.notification.activityStop();
			});
		});
	},
	populateUsers: function(){
		app.downloadUsers(function(){
			switch(tab){
				case 'grupos':
					var c = new Chat();
					c.select(sql,filtroUsuario,true,function(contactos){
						$("#lista-usuarios").html("");
						if( contactos.length>0 ){
							for( var id in contactos ){
								app.addChat(contactos[id]);
							}
						} else {
							$("#lista-usuarios").html("<div class='usuario clearfix text-center'><h2>No hay Grupos para mostrar</h2></div>");
						}
						navigator.notification.activityStop();
						$(".usuario").off("click");
						$(".usuario").on("click",function(e){
							$("#chat-window").html("");
							e.preventDefault();
							receptor = $(this).attr("data-rel");
							app.initializeUser();
						});
					});
					break;
				case 'usuarios':
					var c = new Contacto();
					c.select(sql,filtroUsuario,function(contactos){
						$("#lista-usuarios").html("");
						for( var id in contactos ){
							app.addUser(contactos[id]);
						}
						navigator.notification.activityStop();
						$(".usuario").off("click");
						$(".usuario").on("click",function(e){
							$("#chat-window").html("");
							e.preventDefault();
							var contacto = $(this).attr("data-rel");
							var cct = new ChatContacto();
							cct.select(sql,contacto,function(chat){
								console.log(JSON.stringify(chat));
								receptor = chat;
								app.initializeUser();
							});
						});
					});
					break;
				case 'chats':
					var c = new Chat();
					c.select(sql,filtroUsuario,false,function(contactos){
						$("#lista-usuarios").html("");
						if( contactos.length>0 ){
							for( var id in contactos ){
								app.addChat(contactos[id]);
							}
						} else {
							$("#lista-usuarios").html("<div class='usuario clearfix text-center'><h2>No hay Chats para mostrar</h2></div>");
						}
						navigator.notification.activityStop();
						$(".usuario").off("click");
						$(".usuario").on("click",function(e){
							$("#chat-window").html("");
							e.preventDefault();
							receptor = $(this).attr("data-rel");
							app.initializeUser();
						});
					});
					break;
			}
		});
	},
	downloadMessages: function(callback){
		if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
			var params = {
				user : user,
				secuencia : secuencia
			}
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
					} else {
						console.log(result.errormessage);
					}
					if( callback ){
						callback();
					}
				},
				error: function(result){
					console.log(JSON.stringify(result));
					if( callback ){
						callback();
					}
				}
			});
		} else {
			if( callback ){
				callback();
			}
		}
	},
	downloadUsers: function(callback){
		if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
			var tablas = ['contacto','chat_contacto','chat'];
			for( var id in tablas ){
				var tabla = tablas[id];
				var seq = window.localStorage.getItem("secuencia-"+tabla);
				if( seq==null ){
					seq = 0;
					window.localStorage.setItem("secuencia-"+tabla,"0");
				}
				var data = {
					user:user,
					tabla:tabla,
					secuencia:seq
				};
				$.ajax({
					url:url+"/gcm/list-users.php",
					data:data,
					dataType:'json',
					type:'POST',
					success:function(resp){
						var t = resp.tabla;
						for( var id in resp.rows ){
							switch(t){
								case 'contacto':
									var c = new Contacto();
									c.insert(sql,resp.rows[id]);
									var s = window.localStorage.getItem("secuencia-contacto");
									if( !isNaN(s) && parseInt(s) < c.secuencia ){
										window.localStorage.setItem("secuencia-contacto",c.secuencia);
									}
									break;
								case 'chat':
									var c = new Chat();
									c.insert(sql,resp.rows[id]);
									var s = window.localStorage.getItem("secuencia-chat");
									if( !isNaN(s) && parseInt(s) < c.secuencia ){
										window.localStorage.setItem("secuencia-chat",c.secuencia);
									}
									break;
								case 'chat_contacto':
									var c = new ChatContacto();
									c.insert(sql,resp.rows[id]);
									var s = window.localStorage.getItem("secuencia-chat_contacto");
									if( !isNaN(s) && parseInt(s) < c.secuencia ){
										window.localStorage.setItem("secuencia-chat_contacto",c.secuencia);
									}
									break;
							}
						}
						if( callback && t=='chat'){ // chat es el ultimo elemento del arreglo
							callback();
						}
					},
					error:function(resp){
						console.log(JSON.stringify(resp));
						if( callback ){
							callback();
						}
					}
				});
			}
		} else {
			if( callback ){
				callback();
			}
		}
	},
	readMessages: function(){
		var params = {
			user: user,
			chat:receptor
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
			switch(tab){
				case 'grupos':
					var c = new Chat();
					var title = '';
					var filter = " WHERE chat.id='"+receptor+"'";// DEJAR SIEMPRE ESPACIO AL INICIO
					c.select(sql,filter,true,function(result){
						for( var id in result ){
							var cObj = result[id];
							if( typeof cObj !== 'undefined' ){
								tDom.html("<a href='#' onclick='backButton(); return false;' class='pull-left'><i class='fa fa-angle-left fa-2x'></i></a>");
								var foto = new Image();
								foto.src = cObj.foto;
								var imgCont = document.createElement("div")
								imgCont.className = "foto-usuario";
								imgCont.appendChild(foto);
								tDom.append(imgCont);
								tDom.append(cObj.display_name);
							}
						}
					});
					break;
				default:
					var c = new Chat();
					var title = '';
					var filter = " WHERE c.id='"+receptor+"'";// DEJAR SIEMPRE ESPACIO AL INICIO
					c.select(sql,filter,false,function(result){
						for( var id in result ){
							var cObj = result[id];
							if( typeof cObj !== 'undefined' ){
								tDom.html("<a href='#' onclick='backButton(); return false;' class='pull-left'><i class='fa fa-angle-left fa-2x'></i></a>");
								var foto = new Image();
								foto.src = cObj.foto;
								var imgCont = document.createElement("div")
								imgCont.className = "foto-usuario";
								imgCont.appendChild(foto);
								tDom.append(imgCont);
								tDom.append(cObj.display_name);
							}
						}
					});
					break;
			}
		} else {
			tDom.html("&nbsp;WebClass");
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
	if( buscar ){
		buscar = false;
		$("#tabs-usuarios").show();
		$(".heading").show();
		$("#search-group").hide();
		$("#lista-usuarios").css({marginTop:'3em'});
		return;
	}
	if( receptor!=null ){
		receptor = null;
		filtroUsuario = null;
		app.initializeUser();
		return;
	}
	navigator.app.exitApp();
}
function textToColor(text){
	if( typeof text === 'string' ){
		var color = '';
		for( var i=0; i<text.length; i++ ){
			color += text.charCodeAt(i);
		}
		color = Math.floor(color*16777215).toString(16);
		color = color.substr(0,6)
		return "#"+color;
	}
	return '#000000';
}
