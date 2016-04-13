var searchApp = angular.module('searchApp',['ui.bootstrap',
	'ngSanitize']);

searchApp.filter('html',['$sce',function($sce){
	return function(input){
		return $sce.trustAsHtml(input);
	}
}]);

searchApp.filter('keysOrder', function() {
    return function(input) {
      if (!input) {
        return [];
      }
      return Object.keys(input);
    }
});

searchApp.filter('removeSpaces', [function() {
    return function(string) {
        if (!angular.isString(string)) {
            return string;
        }
        return string.replace(/[\s]/g, '');
    };
}]);

searchApp.directive('toggleClass', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('click', function() {
            	if(attrs.toggleClass=='expand')
            	{
            		element.toggleClass(attrs.toggleClass);
            	}
            	else{
	            	if(element.hasClass(attrs.toggleClass)){
	                	jQuery('.open').removeClass('open');
	                }else{
	                	jQuery('.open').removeClass('open');
	                	element.addClass(attrs.toggleClass);
	                }
	            }
            });
        }
    };
});

searchApp.directive("deviceComponent", function(){
	return {
	restrict: 'E',
	scope:{
		devicedetails:'=',
		selectedpay:'=',
		deviceprices:'=',
		addtocartdevice:'=',
		addtocartaccessory:'='
	},
	replace: true, // Replace with the template below
	transclude: true, // we want to insert custom content inside the directive
	//require:'^filterComponent',
	link: function(scope, element, attrs) {
		//scope.defaultdevice = scope.devicedetails.doclist.docs[0];
		//console.log(scope.selectedpay);
		scope.defaultdevice = scope.devicedetails.docs[0];
		scope.updateddevice = scope.defaultdevice;
		scope.selectedColor = scope.defaultdevice.colorName;
		scope.selectedCapacity = scope.defaultdevice.capacity;
		scope.rate = 0;
		var actual = scope.updateddevice.avgRating;
		var decimal = Math.round((actual%1)*10);
		var rating = Math.floor(actual);
		if(decimal>=0 && decimal<3){
			scope.rate = rating;
		}
		if(decimal>=3 && decimal<8){
			scope.rate = (rating.toString()+"_5");
		}
		if(decimal>=8 && decimal<=10){
			scope.rate = (rating+1);
		}

		scope.contractTerm = {};
		scope.contractTerm.quantity=1;

		scope.addToCart = function(){
			if(scope.contractTerm.price==undefined){
				alert('Please select a pricing option.');
				return false;
			}
			if(scope.contractTerm.price==3){
				openOverlayContentInDiv('overlayDownPayment', 'contentDownPayment', 50);
				return false;
			}
			var _flowExecutionKey = 'e1s1';
			var selectedPhoneId = scope.updateddevice.equipmentId;
			var contractTerm = scope.contractTerm.price;
			var planPhoneCartPos = "";
			var selectedPhoneQty= scope.contractTerm.quantity;
			
		}

		scope.$watch('contractTerm.price',function(price){
			if(price!=null){
				scope.contractTerm.priceQuery = "&contractTerm=" + scope.contractTerm.price;
			}
			else{
				scope.contractTerm.priceQuery = null;
			}
			// console.log(scope.contractTerm.priceQuery);
		});
		
		
		scope.$watchCollection('deviceprices',function(val,old){
			if(val && scope.updateddevice)
			{
				// console.log(val);
				var records =  val;
				var sku = scope.updateddevice.sku;
				for(var r=0; r<records.length; r++){
					if(records[r][sku]){
						scope.devicePrice = records[r][sku];
					}
				};
			}
		},true);
	},
	templateUrl: 'templates/searchApp/deviceComponent.html',
	controller:'deviceCompController'
}
});

searchApp.directive("filterComponent",function(){
	return {
	restrict: 'E',
	replace: true, // Replace with the template below
	link: function(scope, element, attrs) {
		//jQuery('.filters-template').on('change','.filter-payment',function(event){
		scope.payChange = function(constraint,pay_opt,index){
			//console.log(index);
			scope.sendPayOptions(constraint,pay_opt);
			var payKey = constraint.key;
			var payVal = pay_opt;
			var payIndex = index;//payKey.split('#')[1];
			scope.selectedPay[payIndex] = payVal;
			//console.log(scope.selectedPay);
		}
	},
	templateUrl: 'templates/searchApp/filtersComponent.html'
}
});


searchApp.controller("deviceCompController",['$scope','$log','$http', function($scope,$log,$http){

	$scope.isReadonly = true;
	$scope.max = 5;


	$scope.hoveringOver = function(value) {
		$scope.overStar = value;
		$scope.percent = 100 * (value / $scope.max);
	};

	

	$scope.bindColor = function(color){
		var capacity = $scope.selectedCapacity;
		$scope.updateDevice(color.name,capacity);
	}

	$scope.bindCapacity = function(capacity){
		var color = $scope.selectedColor;
		$scope.updateDevice(color,capacity);
	}

	$scope.updateDevice = function(color,capacity){
		var ud = this;
		ud.deviceFound = false;
		// $log.log(color + ' ' + capacity);
		var groupDevices = $scope.devicedetails.docs;
		angular.forEach(groupDevices, function(value, key){
			if(value.colorName == color && value.capacity == capacity){
				$scope.updateddevice = value;
				$scope.selectedColor = color;
				$scope.selectedCapacity = capacity;
				ud.deviceFound = true;
			}
		});

		var lst = $scope.deviceprices;
		var sku = $scope.updateddevice.sku;
		for(var r=0; r<lst.length; r++){
			if(lst[r][sku]){
				$scope.devicePrice = lst[r][sku];
			}
		};
		//$log.log($scope.updateddevice.phoneId);
		
		if(!ud.deviceFound){
			openOverlayContentInDiv('overlayNoColorCapacityDisplay', 'contentNoColorCapacityDisplay', 50);// Function from ajaxOverlay.js in javascript/common 
		}
	}

}]);

searchApp.controller('searchInitController',['$rootScope','$scope','$location','$log','$http','$window','$compile', function($rootScope,$scope,$location,$log,$http,$window,$compile){

		$http.get('resources/fixtures/testData.json').success(function(data){
		$scope.response = data;
		$scope.searchCount = $scope.response.total;
		$scope.activeTab = $scope.response.type.toLowerCase();
		$scope.activeTabSupport = true;
		$scope.activeTabShop = false;

		if($scope.activeTab == "shop"){
			$scope.results = $scope.response.results;
			$scope.searchCountShop = $scope.response.total;
			$scope.activeTabSupport = false;
			$scope.activeTabShop = true;
			$scope.devicefilters=$scope.response.results.facets;
			$scope.deviceCount = $scope.response.results.total;
			$scope.priceSKUs = $scope.response.results.ext.priceReqSKUs;
			$scope.addToCartAccessoryEnabled = $scope.response.addToCartAcessoryEnabled;
			$scope.addToCartDeviceEnabled = $scope.response.addToCartDeviceEnabled;

			$scope.startCount = 0;

		}
		if($scope.activeTab == "support"){
			$scope.searchCountSupport = $scope.response.total;
			$scope.activeTabShop = false;
			$scope.activeTabSupport = true;
			$scope.supportrecords = $scope.response.results.records;
			$scope.supportCount = $scope.response.results.total;

			$scope.supportStartCount = 0;
		}
	});
}]);