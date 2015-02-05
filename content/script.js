angular.module('hr-jobs',[])

.factory('GravityConfig',function(){

	return {
		getPublicKey:function(){
			return localStorage.getItem('public_key') || '';
		},
		getPrivateKey:function(){
			return localStorage.getItem('private_key') || '';
		},
		getBaseUrl:function(){
			return localStorage.getItem('base_url') || '';
		},
		getFormId:function(){
			return parseInt(localStorage.getItem('form_id')) || 0;
		},

		setPublicKey:function(val){
			localStorage.setItem('public_key',val);
		},
		setPrivateKey:function(val){
			localStorage.setItem('private_key',val);
		},
		setBaseUrl:function(val){
			localStorage.setItem('base_url',val);
		},
		setFormId:function(val){
			localStorage.setItem('form_id',val);
		}

	}
} )

.filter('dateToISO', function() {
	return function(input) {
		input = new Date(input).toISOString();
		return input;
	};
})

.controller('JobsCtrl',function($scope,$http,GravityConfig){
	/**
		Form
	*/
	$scope.isFormReady = false;
	$scope.fields = {};
	$scope.formTitle = '';
	$scope.initialize = function(){
		if(!GravityConfig.getPublicKey() || !GravityConfig.getPrivateKey()){
			angular.element('#configModal').modal('show');
		}else{
			$scope.getFormData();
		}
		
		
		
	}
	$scope.allowedType = function(field){
		var allowed = ['text','name','email','address','phone','fileupload'];

		return allowed.indexOf(field)>=0;
	}
	$scope.getFormData = function(){

		if(!GravityConfig.getPublicKey() || !GravityConfig.getPrivateKey()) return;

		$scope.isFormReady = false;
		$scope.formTitle = '';
		var url = generateUrl('forms/'+GravityConfig.getFormId(),'GET');
		$http.get(url)
		.success(function(data){
			if(data.status==200){
				angular.forEach(data.response.fields,function(d){
					$scope.fields[d.id] = {
						label:d.label,
						content:d.content,
						type:d.type
					}
				});

				$scope.formTitle = data.response.title;

				$scope.getEntries();
			}
		})
		.error(function(){
			bootbox.alert('Unable to load from data');
		});

	}

	/**
		Data
	*/
	$scope.entries = [];
	$scope.totalEntries = 0;
	$scope.isLoadingEntries = false;
	var calculateSig = function(stringToSign,privateKey){
		var hash = CryptoJS.HmacSHA1(stringToSign, privateKey);
		var base64 = hash.toString(CryptoJS.enc.Base64);
		return encodeURIComponent(base64);
	}

	var generateUrl = function(route,method){
		var publicKey, privateKey, expiration, method, stringToSign, url, sig,baseUrl;
		publicKey = GravityConfig.getPublicKey();
		privateKey = GravityConfig.getPrivateKey();
		expiration = 3600;
		method = 'GET';
		baseUrl = GravityConfig.getBaseUrl();
		route = route.replace(/\/$/, ""); // remove trailing slash
		baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
		var d = new Date;
		var unixtime = parseInt(d.getTime() / 1000);
		var future_unixtime = unixtime + expiration;

		stringToSign = publicKey + ":" + method + ":" + route + ":" + future_unixtime;
		sig = calculateSig(stringToSign, privateKey);
		url = baseUrl + "/gravityformsapi/" + route + "/?api_key=" + publicKey + "&signature=" + sig + "&expires=" + future_unixtime;

		return url;
	}

	$scope.getEntries = function(){

		if(!GravityConfig.getPublicKey() || !GravityConfig.getPrivateKey()) return;

		if($scope.isLoadingEntries) return;
		$scope.isLoadingEntries = true;
		var url = generateUrl('forms/'+GravityConfig.getFormId()+'/entries','GET');
		url+='&paging[page_size]='+10;
		url+='&paging[offset]='+parseInt(($scope.page - 1)*$scope.perPage);
		$http.get(url)
		.success(function(data){
			if(data.status==200){
				$scope.entries.length = 0;
				$scope.totalEntries = 0
				angular.forEach(data.response.entries,function(d){
					$scope.entries.push(d);
				});
				$scope.totalEntries = data.response.total_count;
			}
			$scope.isLoadingEntries = false;
			$scope.isFormReady = true;
		})
		.error(function(){
			bootbox.alert('Unable to get entries');
			$scope.isLoadingEntries = false;
		});
	}

	$scope.refresh = function(){
		$scope.page = 1;
		$scope.getEntries();
	}
	/**
		Entry Details
	*/

	$scope.loadEntryDetails = function(item){


		if(!GravityConfig.getPublicKey() || !GravityConfig.getPrivateKey()) return;

		$scope.entryDetails = {
		};


		var url = generateUrl('entries/'+GravityConfig.getFormId(),'GET');
		$http.get(url)
		.success(function(data){
			if(data.status==200){
				$scope.entryDetails = item;
			}
		})
		.error(function(){
			bootbox.alert('Unable to load entry details');
		});
		
	}

	/**
		Pagination 
	*/
	$scope.page = 1;
	$scope.perPage = 10;
	$scope.prev = function(){
		if($scope.page>0) $scope.page--;
	}
	$scope.next = function(){
		$scope.page++;
	}
	$scope.$watch('page',function(){
		$scope.getEntries();
	});

	/**
		Configuration 
	*/

	$scope.config = {
		publicKey:GravityConfig.getPublicKey(),
		privateKey:GravityConfig.getPrivateKey(),
		baseUrl:GravityConfig.getBaseUrl(),
		formId:GravityConfig.getFormId(),
	};

	$scope.$watch('config.publicKey',function(val){
		GravityConfig.setPublicKey(val);
	});
	$scope.$watch('config.privateKey',function(val){
		GravityConfig.setPrivateKey(val);
	});
	$scope.$watch('config.baseUrl',function(val){
		GravityConfig.setBaseUrl(val);
	});
	$scope.$watch('config.formId',function(val){
		GravityConfig.setFormId(val);
		$scope.getFormData();
	});


	/**
		About 
	*/
	$scope.showAbout = function(){
		bootbox.alert('This app is a special request by ma\'am ronna :D');
	}

	/**
		Etc
	*/
	$scope.copyText = function(data){
		if (data == null) return; 



		$textarea = angular.element('<textarea></textarea>');
		$textarea.val(data);
		$textarea.appendTo('body');
		$textarea.focus(function(){
			$(this).select();
		});
		$textarea.select();

		document.execCommand('Copy'); 
		$textarea.remove(); 

	}

	$scope.copy = function(name,url){

		$scope.copyText(url);
		bootbox.alert(name+' copied to clipboard.');
			
	
	}
	$scope.validateUrl = function(value){
		return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
	}
	$scope.initialize();
});