(function()
{
	window.addEventListener('polymer-ready', function()
	{
		var xjs = require('xjs');
		var system = xjs.System;
		var Item = xjs.Item;
		var configWindow;
		var myItem;
		var configObj = {};
		var CUSTOM_TAB_NAME = 'Twitch Chat';

		xjs.ready()
		.then(function() {
			configWindow = xjs.SourcePropsWindow.getInstance();
			// configure tabs in source properties dialog
			configWindow.useTabbedWindow({
				customTabs: [CUSTOM_TAB_NAME],
				tabOrder: [CUSTOM_TAB_NAME, 'Layout', 'Color', 'Transition']
			});
		})
		.then(Item.getItemList)
		.then(function(item) {
			myItem = item[0];

			var display = document.getElementById('display');
			var channelInput = document.getElementsByName('channel')[0];
			var displayBox = display.querySelector('.box');

			document.onselectstart = function(event)
			{
				// disable selection if not input/textarea/xui-input
				var nodeName = event.target.nodeName;
				if (nodeName === 'INPUT' || nodeName === 'TEXTAREA' || nodeName === 'XUI-INPUT')
				{
					return true;
				}
				else
				{
					return false;
				}
			};
			document.oncontextmenu = function(){ return false; };

			var errorMessage = document.getElementsByName('error')[0];

			var	channelConnectButton = document.getElementsByName('connect')[0];
			channelConnectButton.addEventListener('click', function()
			{
				// check if channel is valid/existing
				var remotePath = channelInput.value;

				var req = new XMLHttpRequest();
				req.open('GET', remotePath);

				req.onload = function()
				{
					if (req.status == 200)
					{
						errorMessage.parentNode.removeAttribute('notfound');
						resizeDisplaySection();

						var channelValue = (channelInput.value).toLowerCase();
						configObj.json = channelValue;
						setConfig(true);
					}
					else
					{
						errorMessage.textContent = 'JSON 주소가 올바르지 않습니다.';
						errorMessage.parentNode.setAttribute('notfound', 'notfound');
						resizeDisplaySection();
					}
				};

				// Handle network errors
				req.onerror = function()
				{
					errorMessage.textContent = '인터넷 연결 확인후 재시도해 주세요.';
					errorMessage.parentNode.setAttribute('notfound', 'notfound');
					resizeDisplaySection();
				};
				req.setRequestHeader('Access-Control-Allow-Origin', '*');
				req.setRequestHeader('Cache-Control', 'no-cache');
				// Make the request
				req.send();
				// we call this since button has css state for focus
				this.blur();
			});

			var enableChannelConfig = function()
			{
				channelInput.disabled = false;
				channelConnectButton.disabled = false;
			};

			// Remove some unnecessary error logs
			window.OnDialogLoadStart = function() {};
			window.OnDialogTitleChange = function() {};
			window.OnDialogBeforeNavigation = function() {};
			window.SetVolume = function() {};

			/* WINDOW RELATED FUNCTIONS */
			var resizeDisplaySection = function()
			{
				var newHeight = window.innerHeight - parseInt(displayBox.getBoundingClientRect().top) - parseInt(window.getComputedStyle(display,null).getPropertyValue('padding-bottom'));
				displayBox.style.height = newHeight + 'px';
			};

			var getSettings = function()
			{
				// get installed fonts and load them onto the dropdowns
				system.getFonts().then(function(fontArray) {
					return myItem.loadConfig();
				})
				.then(function(config) {
					configObj = config;
					// load configuration settings or use default if not present
					if (!configObj.hasOwnProperty('channel')) {
						configObj.json = '';
					}
					channelInput.value = configObj.json;
					enableChannelConfig();

					/*
					 * use setTimeout as a work-around for bug:
					 * eventlisteners added below still are somewhat triggered
					 * by above loading of settings
					 * (maybe due to bubbling/propagation, for further investigation)
					 */
					setTimeout(function(){
						addComponentEventListeners();
					}, 0);
				});
			};

			var setConfig = function(close)
			{
				cssString = '';
				myItem.setCustomCSS(cssString).then(function() {
					return myItem.requestSaveConfig(configObj);
				})
				.then(function() {
					if (typeof close !== 'undefined' && close) {
						configWindow.close();
					}
				});
			};

			getSettings();
			resizeDisplaySection();

			configWindow.on('set-selected-tab', function(val) {
				if (val == CUSTOM_TAB_NAME) {
					resizeDisplaySection();
				}
			});

		});

	});
})();