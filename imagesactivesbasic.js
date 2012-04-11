jQuery.fn.imagesActivesBasic = function(method) {
	var methods = {
		init : function(options) {
			var $element = $(this);
			this.imagesActivesBasic.settings = jQuery.extend({},
					this.imagesActivesBasic.defaults, options);
			if (options.options) {
				var xml = jQuery.fn.imagesActivesBasic
						.xmlConversion(options.options);
				return this.each(function() {
					$element.imagesActivesBasic("createObjects", xml);
				});
			} else if (options.optionsFile)
				return this
						.each(function() {
							jQuery
									.ajax({
										type : "GET",
										url : options.optionsFile,
										dataType : "xml",
										context : $element,
										success : function(data) {
											$element.imagesActivesBasic(
													"createObjects", data);
										},
										error : function(jqXHR, textStatus,
												errorThrown) {
											jQuery.error('response: '
													+ jqXHR.responseText);
											jQuery
													.error('code: '
															+ jqXHR
																	.getResponseHeader('X-Subscriber-Status'));
										}

									});

						});
			else
				jQuery
						.error('You must provide options in xml format either as a file or as plain text.');
		},
		createObjects : function(data) {
			var dao = new jQuery.fn.imagesActivesBasic.DAO(this, data);
			var ui = new jQuery.fn.imagesActivesBasic.UI(this, dao);
			var control = new jQuery.fn.imagesActivesBasic.Control(ui, dao);

		}
	};
	if (methods[method]) {
		return methods[method].apply(this, Array.prototype.slice.call(
				arguments, 1));
	} else if (typeof method === 'object' || !method) {
		return methods.init.apply(this, arguments);
	} else {
		jQuery.error('Method "' + method
				+ '" does not exist in imagesActivesBasic plugin!');
	}
};
jQuery.fn.imagesActivesBasic.xmlConversion = function(xmlData) {
	if (window.ActiveXObject) {
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = "false";
		xmlDoc.loadXML(xmlData);
		return xmlDoc;
	} else if (document.implementation
			&& document.implementation.createDocument) {
		parser = new DOMParser();
		xmlDoc = parser.parseFromString(xmlData, "text/xml");
		return xmlDoc;
	}
};
jQuery.fn.imagesActivesBasic.patterns = {
	DETAIL : /^detail\d+$/,
	NAVBAR_KEY : /^index_detail\d+$/
};
jQuery.fn.imagesActivesBasic.defaults = {
	unity : 0.03,
	panels_hiding_delay : 3000,
	panels_sliding_duration : 500,
	min_textbox_width : 0.3,
	min_textbox_height : 0.3,
	zoom_margin : 6,
	zoom_interpolation_frames : 10,
	credit_image_proportion : 0.85,
	details_navbar_max_item : 5,
	embedBitmaps : "noembed",
	embedSvgIcons : "noembed",
	topBar : 0,
	handleOpacity : 0.7,
	details_hover_animation_delay : 400
};
jQuery.fn.imagesActivesBasic.settings = {};
jQuery.fn.imagesActivesBasic.DAO = function(element, data) {
	this.svg = element[0];
	this.data = data;
	this.data = this.getElementByTagNameNSPortable(this.data, "images_actives",
			"project");
	this.collectInformation();
};
jQuery.fn.imagesActivesBasic.DAO.namespaces = {
	images_actives : "http://www.crdp.ac_versailles.fr/2011/images_actives",
	quiz : "http://www.crdp.ac_versailles.fr/2011/images_actives/behaviors/quiz",
	discovery : "http://www.crdp.ac_versailles.fr/2011/images_actives/behaviors/discovery",
};
jQuery.fn.imagesActivesBasic.DAO.OVERALL_DESCRIPTION = "overall_description";
jQuery.fn.imagesActivesBasic.DAO.LINK_WITH_SPACE_AFTER_AROBASE_PATTERN = /([^@]+)@\s+([^\}]*[^\s\}])\s*\}/;
jQuery.fn.imagesActivesBasic.DAO.LINK_WITH_FINAL_SPACE_PATTERN = /([^@]+)@\s*([^\}]*[^\s\}])\s+\}/;
jQuery.fn.imagesActivesBasic.DAO.LINK_PATTERN = /\{([^@]*[^\s@])@([^\}]*[^\s\}@])\}/;
jQuery.fn.imagesActivesBasic.DAO.prototype = {
	getTitle : function() {
		return this.title;
	},
	getDetailTitle : function(detailId) {
		return this.captions[detailId].title;
	},
	getDetailDesc : function(detailId) {
		return this.captions[detailId].desc;
	},
	collectInformation : function() {
		this.captions = new Object();
		var node;
		for ( var i in this.svg.childNodes) {
			node = this.svg.childNodes[i];
			switch (node.nodeName) {
			case 'title':
				this.title = node.textContent;
				node.textContent = "";
				break;
			case 'metadata':
				this.extractMetaData(node.firstElementChild.firstElementChild);
				break;

			default:
				if (node && node.id) {
					if (node.id
							.match(jQuery.fn.imagesActivesBasic.patterns.DETAIL)) {
						if (this.hasOnlyEmptyText(node))
							node.setAttribute("empty", "empty");
						else
							this.extractDetailInformation(node);

					} else if (node.nodeName == "image"
							&& node.id == "background")
						this.extractBackgroundInformation(node);
				}

				break;
			}
		}
	},
	hasOnlyEmptyText : function(node) {
		return node
				&& node.tagName != "image"
				&& node.childElementCount == 2
				&& node.getElementsByTagName("title").length == 1
				&& node.getElementsByTagName("desc").length == 1
				&& node.getElementsByTagName("title")[0].textContent
						.match(/^\s*$/)
				&& node.getElementsByTagName("desc")[0].textContent
						.match(/^\s*$/);
	},
	extractDetailInformation : function(node) {
		var titleNode = node.getElementsByTagName("title")[0];
		var descNode = node.getElementsByTagName("desc")[0];
		var title = titleNode ? titleNode.textContent : "";
		var desc = descNode ? descNode.textContent : "";
		desc = this.insertLinks(desc);
		if (titleNode)
			titleNode.textContent = "";
		if (descNode)
			descNode.textContent = "";
		this.captions[node.id] = {
			title : title,
			desc : desc
		}
	},
	insertLinks : function(text) {
		text = this
				.replaceByLink(
						jQuery.fn.imagesActivesBasic.DAO.LINK_WITH_SPACE_AFTER_AROBASE_PATTERN,
						text);
		text = this.replaceByLink(
				jQuery.fn.imagesActivesBasic.DAO.LINK_WITH_FINAL_SPACE_PATTERN,
				text);
		text = this.replaceByLink(
				jQuery.fn.imagesActivesBasic.DAO.LINK_PATTERN, text);
		return text;
	},
	replaceByLink : function(pattern, text) {
		return text.replace(pattern, '<a href="$2" target="_blank">$1</a>')
	},
	extractBackgroundInformation : function(node) {
		var titleNode = node.getElementsByTagName("title")[0];
		var descNode = node.getElementsByTagName("desc")[0];
		var titre = titleNode ? titleNode.textContent : "";
		var desc = descNode ? descNode.textContent : "";
		if (titleNode)
			titleNode.textContent = "";
		if (descNode)
			descNode.textContent = "";
		this.captions[jQuery.fn.imagesActivesBasic.DAO.OVERALL_DESCRIPTION] = {
			title : titre,
			desc : desc
		}
	},
	extractMetaData : function(node) {
		this.captions["metadata"] = {
			title : this.extractMetadataNodeContent(node, "title"),
			source : this.extractMetadataNodeContent(node, "source"),
			infos : this.extractMetadataNodeContent(node, "infos"),
			rights : this.extractMetadataNodeContent(node, "rights", true),
			creator : this.extractMetadataNodeContent(node, "creator", true),
			date : this.extractMetadataNodeContent(node, "date")
		};
		jQuery(node).empty();
	},
	getMetadataTitle : function() {
		return this.captions["metadata"].title;
	},
	getMetadataContent : function() {
		var content = "";
		for ( var key in this.captions["metadata"]) {
			if (key == "title")
				continue;
			if (!this.captions["metadata"][key].match(/^\s*$/))
				content += "<p>" + this.captions["metadata"][key] + "</p>";
		}
		return content;
	},
	extractMetadataNodeContent : function(metadata, key1, special) {
		var node = metadata.getElementsByTagName("dc:" + key1)[0];
		if (special && node) {
			node = node.getElementsByTagName("cc:Agent")[0];
			if (node)
				node = node.getElementsByTagName("dc:title")[0];
		}
		var content = "";
		if (node) {
			content = node.textContent;
		}
		return content;
	},
	getColorParameter : function(key) {
		return jQuery(this.data).find("#" + key).text();
	},
	getCommonInteractivityParameter : function(key) {
		var paramsNode = this.getElementByTagNameNSPortable(this.data,
				"images_actives", "common_interactivity_parameters");
		return this.getElementByTagNameNSPortable(paramsNode, "images_actives",
				key).firstChild.data;
	},
	getSpecificInteractivityParameter : function(key) {
		var paramsNode = this.getElementByTagNameNSPortable(this.data,
				"images_actives", "specific_interactivity_parameters");
		return this.getElementByTagNameNSPortable(paramsNode, this
				.getInteractivityType(), key).firstChild.data;
	},
	getInteractivityType : function() {
		var paramsNode = this.getElementByTagNameNSPortable(this.data,
				"images_actives", "specific_interactivity_parameters");
		return this.getAttributeNSPortable(paramsNode, "interactivity_type");

	},
	getSpecificText : function(key) {
		var paramsNode = this.getElementByTagNameNSPortable(this.data,
				"images_actives", "specific_texts");
		return this.getElementByTagNameNSPortable(paramsNode, this
				.getInteractivityType(), key).firstChild.data;
	},
	getBehaviorNamespace : function(behavior) {
		return jQuery.fn.imagesActivesBasic.DAO.mainNS + "/behaviors/"
				+ this.getInteractivityType();
	},
	getElementByTagNameNSPortable : function(root, nsKey, tagName) {
		if (!jQuery.browser.msie)
			return root
					.getElementsByTagNameNS(
							jQuery.fn.imagesActivesBasic.DAO.namespaces[nsKey],
							tagName)[0];
		return root.getElementsByTagName(nsKey + ":" + tagName)[0];
	},
	getAttributeNSPortable : function(elem, attr) {
		if (!jQuery.browser.msie)
			return elem.getAttributeNS(null, attr);
		return elem.getAttribute(attr);
	}
};

jQuery.fn.imagesActivesBasic.UI = function(element, dao) {
	this.svg = element[0];
	this.dao = dao;
	this.determinateDevice();
	this.handleResize();
	this.wrapSVG();
	this.createHeader();
	this.createHeaderHandle();
	this.createHeaderButtons();
	this.createHeaderScrollArrows();
	this.createFooter();
	this.createFooterHandle();
	this.createTextBox();
	this.parseSVG();
	this.createCreditPanel();
	this.organizeNavbar();
	this.createShader();
	this.detailsOpacity(0);
	this.fitToViewport(null);
	this.listenToInteractions();
	$(this.svg).css("opacity", 1);
};
jQuery.fn.imagesActivesBasic.UI.buttons = {
	INFOS : "infos",
	DETAILS : "details",
	METADATA : "metadata",
	DESCRIPTION : "description"
};
jQuery.fn.imagesActivesBasic.UI.svgNS = "http://www.w3.org/2000/svg";
jQuery.fn.imagesActivesBasic.userEvents = {
	HOVER_DETAIL : "hover_detail",
	SELECT_DETAIL : "select_detail",
	UNSELECT_DETAIL : "unselect_detail",
	CLICK_HEADER_TAB : "click_header_tab",
	CLICK_FOOTER_TAB : "click_footer_tab",
	CLICK_OUTSIDE_DETAIL : "click_outside_detail",
	DISPLAY_ALL_DETAILS : "display_all_details",
	DISPLAY_DESCRIPTION : "display_description",
	DISPLAY_METADATA : "display_metadata",
	ZOOM_FINISHED : "zoom_finished",
	HIDE_TEXT_BOX : "hide_text_box",
	DISPLAY_ANSWER : "diplay_answer",
	VALID_PASSWORD : "valid_password",
	STOP_HEADER_AUTOMATIC_REMOVAL : "stop_header_automatic_removal",
	STOP_FOOTER_AUTOMATIC_REMOVAL : "stop_footer_automatic_removal"
};
jQuery.fn.imagesActivesBasic.pcEvents = [ "mousedown", "mouseover", "mouseout" ];
jQuery.fn.imagesActivesBasic.mobileEvents = [ "touchstart", "touchmove",
		"gesturestart", "gesturechange", "gestureend" ];
jQuery.fn.imagesActivesBasic.UI.prototype = {
	determinateDevice : function() {
		this.mobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i
				.test(navigator.userAgent.toLowerCase()));
	},
	handleResize : function() {
		if (this.mobile)
			window.addEventListener(this.mobile ? "orientationchange"
					: "resize", jQuery.proxy(this, "fitToViewport"), true);
		else
			window.addEventListener("resize", jQuery.proxy(this,
					"fitToViewport"), true);
	},
	wrapSVG : function() {
		this.container = jQuery(document.createElement("div"));
		this.container.addClass("container-image-active");
		this.upperElement = jQuery(this.svg).parent();
		this.container.append(jQuery(this.svg));
		this.upperElement.append(this.container);
	},
	parseSVG : function() {
		this.detailNodes = new Object();
		this.detailsDimensions = new Object();
		this.detailsCaptionsAvailableSpace = new Object();
		for ( var i in this.svg.childNodes) {
			node = this.svg.childNodes[i];
			if (this.isDetail(node)) {
				this.detailNodes[node.id] = node;
			} else if (this.isBackground(node)) {
				this.background = node;
			}
		}
		this.getBackgroundSize();
		this.setOverallDescriptionDisplaySpace();
		this.processDetails();
	},
	setOverallDescriptionDisplaySpace : function() {
		this.detailsCaptionsAvailableSpace[jQuery.fn.imagesActivesBasic.DAO.OVERALL_DESCRIPTION] = {
			top : 0,
			left : 0,
			width : this.imageWidth,
			height : this.imageHeight
		}
	},
	processDetails : function() {
		this.previousDetailButton = this
				.addItemToNavBar("previous_detail", "<");
		var detail;
		var nbDetails = 0;
		for ( var key in this.detailNodes) {
			nbDetails++;
			detail = this.detailNodes[key];
			this.detailsDimensions[key] = detail.getBoundingClientRect();
			this.calculateDetailCaptionAvailableSpace(key);
			detail.setAttributeNS(null, "class", "detail");
			if (!this.isPuce(detail))
				this.convertToClipPath(detail);
			this.addDetailToNavBar(key, nbDetails);
		}
		this.nextDetailButton = this.addItemToNavBar("next_detail", ">");
	},
	addDetailToNavBar : function(detailId, number) {
		this.addItemToNavBar("index_" + detailId, number)

	},
	addItemToNavBar : function(id, content) {
		var item = jQuery(document.createElement("span"));
		item.attr("id", id);
		item.text("" + content);
		this.footerContent.append(item);
		return item;
	},
	organizeNavbar : function() {
		var buttons = this.footer.find("span");
		var nbDetails = buttons.length - 2;
		if (nbDetails <= jQuery.fn.imagesActivesBasic.settings.details_navbar_max_item) {
			this.nextDetailButton.hide();
			this.previousDetailButton.hide()
		} else {
			this.firstNavbarButtonDisplayed = 1;
			this.handleNavbarOverflow();
		}
	},
	handleNavbarOverflow : function() {
		var buttons = this.footer.find("span");
		this.previousDetailButton.toggleClass("disabled",
				this.firstNavbarButtonDisplayed == 1);
		this.nextDetailButton
				.toggleClass(
						"disabled",
						this.firstNavbarButtonDisplayed > (buttons.length - 2 - jQuery.fn.imagesActivesBasic.settings.details_navbar_max_item));
		for ( var i = 1; i < buttons.length - 1; i++) {
			$(buttons[i])
					.toggle(
							i >= this.firstNavbarButtonDisplayed
									&& i < this.firstNavbarButtonDisplayed
											+ jQuery.fn.imagesActivesBasic.settings.details_navbar_max_item);
		}
	},
	navigateInNavbar : function(offset) {
		this.firstNavbarButtonDisplayed += offset;
		this.firstNavbarButtonDisplayed = Math
				.max(
						1,
						Math
								.min(
										this.firstNavbarButtonDisplayed,
										this.footer.find("span").length
												- 1
												- jQuery.fn.imagesActivesBasic.settings.details_navbar_max_item));
		this.handleNavbarOverflow();
	},
	calculateDetailCaptionAvailableSpace : function(detailId) {
		var dimensions = this.detailsDimensions[detailId];
		var spaces = new Object();
		spaces["up"] = {
			width : this.imageWidth,
			height : Math.max(0, dimensions.top),
			top : 0,
			left : 0

		};
		spaces["down"] = {
			width : this.imageWidth,
			height : this.imageHeight
					- Math.min(this.imageHeight, dimensions.bottom),
			top : Math.max(0, dimensions.bottom),
			left : 0

		};
		spaces["right"] = {
			width : this.imageWidth
					- Math.min(dimensions.right, this.imageWidth),
			height : this.imageHeight,
			top : 0,
			left : Math.max(0, dimensions.right)
		};
		spaces["left"] = {
			width : Math.max(0, dimensions.left),
			height : this.imageHeight,
			top : 0,
			left : 0
		};
		var maxSpace = 0;
		var key = "";
		var space = 0;
		for ( var i in spaces) {
			space = spaces[i].width * spaces[i].height;
			if (space >= maxSpace) {
				key = i;
				maxSpace = space;
			}

		}
		if (this.isTooSmall(spaces[key]))
			this.detailsCaptionsAvailableSpace[detailId] = {
				top : 0,
				left : 0,
				width : this.imageWidth,
				height : this.imageHeight * 0.5
			};
		else
			this.detailsCaptionsAvailableSpace[detailId] = spaces[key];
	},
	isTooSmall : function(spaceforTextBox) {
		return spaceforTextBox.width < jQuery.fn.imagesActivesBasic.settings.min_textbox_width
				* this.imageWidth
				|| spaceforTextBox.height < jQuery.fn.imagesActivesBasic.settings.min_textbox_height
						* this.imageHeight
	},
	convertToClipPath : function(detail) {

		var newDef = document.createElementNS(
				jQuery.fn.imagesActivesBasic.UI.svgNS, "clipPath");
		newDef.setAttributeNS(null, "id", "clip_" + detail.id);
		detail
				.setAttributeNS(null, "clip-path", "url(#clip_" + detail.id
						+ ")");
		jQuery(newDef).append(
				jQuery(detail).find("*").not("g").not("title").not("desc"));
		jQuery(detail).empty();
		this.getOrCreateDefsNode().appendChild(newDef);

		var shadingColor = this.dao
				.getCommonInteractivityParameter("shading_color");
		var rect = document.createElementNS(
				jQuery.fn.imagesActivesBasic.UI.svgNS, "rect");
		rect.setAttributeNS(null, "width", this.imageWidth);
		rect.setAttributeNS(null, "height", this.imageHeight);
		rect.setAttributeNS(null, "style", "fill:#"
				+ shadingColor.replace("0x", ""));

		var backgroundCopy = this.background.cloneNode(false);
		detail.appendChild(backgroundCopy);

		detail.appendChild(rect);

	},
	getOrCreateDefsNode : function() {
		if (!this.defs) {
			var defs = this.svg.getElementsByTagName("defs");
			if (defs.length > 0)
				this.defs = defs[0];
			else {
				this.defs = document.createElementNS(
						jQuery.fn.imagesActivesBasic.UI.svgNS, "defs");
				this.svg.appendChild(this.defs);
			}

		}
		return this.defs;
	},
	getDef : function(detailId) {
		if (!this.defs)
			return null;
		return jQuery(this.defs).find("#clip_" + detailId);
	},
	createShader : function() {
		this.shader = document.createElementNS(
				jQuery.fn.imagesActivesBasic.UI.svgNS, "rect");
		this.shader.setAttributeNS(jQuery.fn.imagesActivesBasic.UI.svgNS, "id",
				"shader");
		this.shader.setAttribute("visibility", "hidden");
		this.shader.setAttributeNS(null, "width", this.imageWidth);
		this.shader.setAttributeNS(null, "height", this.imageHeight);
		this.shader.setAttributeNS(null, "style", "fill:#000000");
		$(this.shader).insertAfter(this.background);
	},
	displayShader : function(color, opacity, detailId) {
		this.shader.setAttributeNS(null, "style", "fill:#"
				+ color.replace("0x", ""));
		this.shader.setAttribute("visibility", "visible");
		$(this.shader).attr("opacity", 0);
		$(this.shader).animate({"opacity":opacity}, jQuery.fn.imagesActivesBasic.settings.details_hover_animation_delay);
		
	},
	hideShader : function() {
		this.shader.setAttribute("visibility", "hidden");
	},
	fitToViewport : function(e) {
		var containerHeight = window.innerHeight;
		this.topMargin = 0;
		var problemWithIPadIBooksBar = (this.imageHeight / this.imageWidth) > (1024 / 768);
		if (problemWithIPadIBooksBar
				&& jQuery.fn.imagesActivesBasic.settings.topBar > 0
				&& this.imageHeight
						+ jQuery.fn.imagesActivesBasic.settings.topBar > 1024) {
			containerHeight = window.innerHeight
					- jQuery.fn.imagesActivesBasic.settings.topBar;
			this.topMargin = jQuery.fn.imagesActivesBasic.settings.topBar;
		}
		this.scaleFactor = Math.min(window.innerWidth / this.imageWidth,
				containerHeight / this.imageHeight);
		this.unity = parseFloat(this.baseUnity) * parseFloat(this.scaleFactor);
		this.scale();
		this.center();
		this.resizeContainer();
		this.resizeHeader();
		this.resizeFooter();
		this.resizeCreditPanel();
		this.resizeTextBox();
		this.resizeFilter();
	},
	resizeContainer : function() {
		this.container.css("height", this.imageHeight * this.scaleFactor);
		this.container.css("width", this.imageWidth * this.scaleFactor);
		$(this.svg).css("height", this.imageHeight * this.scaleFactor);
		$(this.svg).css("width", this.imageWidth * this.scaleFactor);
	},
	resizeHeader : function() {
		this.header.css("width", this.imageWidth * this.scaleFactor
				- this.unity / 2);
		this.header.css("padding", (this.unity / 4) + "px");
		this.header.css("font-size", this.unity * 1.5);
		this.header.css("height", this.unity * 2.5);

		if (!this.headerVisible)
			this.header.css("top", -this.header.height() - this.unity);
		var button, icon;
		for ( var key in this.headerButtons) {
			button = this.headerButtons[key];
			icon = button.find("img,svg");
			icon.css("width", this.unity * 1.5);
			icon.css("height", this.unity * 1.5);
			button.css("margin-left", this.unity * 0.5);
			button.css("margin-top", this.unity * 0.25);
			button.css("width", this.unity * 1.5);
			button.css("height", this.unity * 1.5);
			button.css("padding", this.unity * 0.15);
		}
		if (this.mobile)
			this.title.css("overflow-x", "auto");
		var leftSpace = this.unity * 4.5;
		this.titleWidth = this.header.width()
				- this.headerButtonContainer.width() - leftSpace - this.unity
				/ 2;
		this.title.scrollLeft(0);
		this.title.css("width", "auto");
		this.showArrow("left", false);

		this.leftScrollArrow.css("margin-left", leftSpace);
		if (this.title.width() > this.titleWidth) {
			this.showArrow("right", true);
			this.title.css("margin-left", 0);
			this.rightScrollArrow.css("margin-left", this.unity / 4);
			this.leftScrollArrow.css("margin-right", this.unity / 4);
			this.title.width(this.titleWidth - this.unity * 0.5);
		} else {
			this.showArrow("right", false);
			this.title.width(this.titleWidth);
		}

		this.headerHandleUp.height(this.unity * 3.5);
		this.headerHandleDown.height(this.unity * 3.5);
		this.headerHandleUp.css("left", this.unity / 2);

		this.headerHandleDown.css("left", this.unity / 2);
		this.headerHandleUp.css("top", -this.unity / 2);

		this.headerHandleDown.css("top", -this.unity / 2);
	},
	scrollTitle : function(direction) {
		if (this.scrollMotion)
			clearInterval(this.scrollMotion);
		this.showArrow("left", direction != "left");
		this.showArrow("right", direction == "left");

		if (direction == "left") {
			this.title.scrollLeft(0);
		} else {
			this.offset = this.unity / 2;
			this.scrollMotion = setInterval($.proxy(this, "autoScrollTitle"),
					100);
		}

	},
	autoScrollTitle : function(direction) {
		this.title.scrollLeft(this.title.scrollLeft() + this.offset);
		if (this.title.scrollLeft() + this.title.get(0).offsetWidth >= this.title
				.get(0).scrollWidth)
			clearInterval(this.scrollMotion);
	},
	showArrow : function(direction, bool) {
		var arrow = direction == "left" ? this.leftScrollArrow
				: this.rightScrollArrow;
		if (arrow.is("img")) {
			arrow.width(bool ? this.unity / 2 : 0.01);
		} else
			arrow.find("img,svg").width(bool ? this.unity / 2 : 0);
		if (direction == "right") {
			arrow.css("margin-right", bool ? -this.unity / 2 : 0);
			this.title.css("margin-right", bool ? 0 : -this.unity / 2);
		}

	},
	updateArrows : function() {
		if (this.scrollMotion)
			clearInterval(this.scrollMotion);
		var leftInvisible = this.title.scrollLeft() == 0;
		var rightInvisible = this.title.scrollLeft()
				+ this.title.get(0).offsetWidth >= this.title.get(0).scrollWidth;
		this.showArrow("left", !leftInvisible);
		this.showArrow("right", !rightInvisible);
		this.title.width(this.titleWidth - (leftInvisible ? 0 : this.unity / 2)
				- (rightInvisible ? 0 : this.unity / 2));
	},
	resizeFooter : function() {
		this.footer.css("width", this.imageWidth * this.scaleFactor
				- this.unity / 2);
		this.footer.css("bottom", 0);
		this.footer.css("padding", (this.unity / 4) + "px");
		this.footer.css("font-size", this.unity * 1.5);
		this.footer.css("height", this.unity * 2.5);
		this.footerHandleUp.height(this.unity * 3.5);
		this.footerHandleDown.height(this.unity * 3.5);

		this.footerHandleUp.css("left", this.unity / 2);
		this.footerHandleDown.css("left", this.unity / 2);
		this.footerHandleUp.css("bottom", -this.unity / 2);
		this.footerHandleDown.css("bottom", -this.unity / 2);
		if (!this.footerVisible)
			this.footer.css("bottom", -this.footer.height() - this.unity * 0.5);

	},
	resizeCreditPanel : function() {
		if (!this.creditPanel.is(":visible"))
			return;
		this.evaluateProportions();
		if (this.resizeImageByWidth) {
			this
					.flexibleWidth(
							this.creditImage,
							this.imageWidth
									* this.scaleFactor
									* jQuery.fn.imagesActivesBasic.settings.credit_image_proportion);
			this
					.flexibleHeight(
							this.creditImage,
							this.imageWidth
									* this.scaleFactor
									* jQuery.fn.imagesActivesBasic.settings.credit_image_proportion);

		} else {
			this
					.flexibleWidth(
							this.creditImage,
							this.imageHeight
									* this.scaleFactor
									* jQuery.fn.imagesActivesBasic.settings.credit_image_proportion);
			this
					.flexibleWidth(
							this.creditImage,
							this.imageHeight
									* this.scaleFactor
									* jQuery.fn.imagesActivesBasic.settings.credit_image_proportion);

		}
		this.creditPanel.css("left", ($(this.svg).width() - this.creditImage
				.width()) / 2);
		this.creditPanel.css("top", ($(this.svg).height() - this.creditImage
				.height()) / 2);
		this.creditPanel.css("height", this.creditImage.height());
		this.creditPanelCloseButton.css("top", this.unity / 2);
		this.creditPanelCloseButton.css("right", this.unity / 2);
		this.creditPanelCloseButton.css("width", this.unity * 1.5);
		this.creditPanelCloseButton.css("height", this.unity * 1.5);

	},
	flexibleHeight : function(elem, height) {
		if (elem.is("img")) {
			elem.height(height);
		} else {
			elem.find("svg").css("height", height);
		}
	},
	flexibleWidth : function(elem, width) {
		if (elem.is("img")) {
			elem.width(width);
		} else {
			elem.find("svg").css("width", width);
		}
	},
	createCreditPanel : function() {
		this.creditPanel = jQuery(document.createElement("div"));
		this.creditPanel.attr("id", "credit-panel");
		this.creditPanelCloseButton = this.createVectorImage("close");
		this.creditPanelCloseButton.attr("class", "close-button");
		this.creditImage = this.createVectorImage("credits");
		this.evaluateProportions();

		this.creditPanel.append(this.creditPanelCloseButton).append(
				this.creditImage);
		jQuery(this.footer).after(this.creditPanel);
		this.displayCreditPanel(false)
	},
	evaluateProportions : function() {
		var svg = this.creditImage.find("svg");
		var imw = jQuery.fn.imagesActivesBasic.settings.embedSvgIcons == "embed" ? svg.get(0).width.baseVal.value
				: this.creditImage.get(0).width;
		var imh = jQuery.fn.imagesActivesBasic.settings.embedSvgIcons == "embed" ? svg.get(0).height.baseVal.value
				: this.creditImage.get(0).height;
		this.creditImageProportion = imw / imh;
		this.resizeImageByWidth = this.creditImageProportion > (this.imageWidth / this.imageHeight);
	},
	displayCreditPanel : function(bool) {
		if (!bool) {
			this.creditPanel.hide();
		} else {
			this.creditPanel.show();
			this.resizeCreditPanel();
			this.creditPanel.fadeIn();
		}
	},
	createHeader : function() {
		this.header = jQuery(document.createElement("header"));
		this.title = jQuery(document.createElement("span"));
		this.title.attr("id", "main-title");
		this.title.addClass("horizontal-scroll");
		this.title.text(this.dao.getTitle());
		this.header.addClass("title");
		this.header.append(this.title);
		jQuery(this.svg).before(this.header);
	},
	createHeaderHandle : function() {
		this.headerHandleUp = this.createVectorImage("bouton-header-handle-up");
		this.headerHandleUp.attr("class", "bouton-header-handle");
		this.headerHandleDown = this
				.createVectorImage("bouton-header-handle-down");
		this.headerHandleDown.attr("class", "bouton-header-handle");
		this.headerHandleDown.css("opacity",
				jQuery.fn.imagesActivesBasic.settings.handleOpacity);
		this.header.after(this.headerHandleUp);
		this.header.after(this.headerHandleDown);
		this.updateHeaderHandleIcon();
	},
	createFooter : function() {
		this.footer = jQuery(document.createElement("footer"));
		this.footerContent = jQuery(document.createElement("div"));
		this.footer.append(this.footerContent);
		jQuery(this.svg).after(this.footer);

	},
	createFooterHandle : function() {
		this.footerHandleUp = this.createVectorImage("bouton-footer-handle-up");
		this.footerHandleUp.attr("class", "bouton-footer-handle");
		this.footerHandleUp.css("opacity",
				jQuery.fn.imagesActivesBasic.settings.handleOpacity);
		this.footerHandleDown = this
				.createVectorImage("bouton-footer-handle-down");
		this.footerHandleDown.attr("class", "bouton-footer-handle");
		this.footer.before(this.footerHandleUp);
		this.footer.before(this.footerHandleDown);

	},
	createHeaderButtons : function() {
		this.headerButtons = new Object();
		this.headerButtonContainer = jQuery(document.createElement("div"));
		this.header.append(this.headerButtonContainer);
		for ( var key in jQuery.fn.imagesActivesBasic.UI.buttons) {
			this.headerButtons[jQuery.fn.imagesActivesBasic.UI.buttons[key]] = this
					.createHeaderButton(key);
			this.headerButtonContainer
					.append(this.headerButtons[jQuery.fn.imagesActivesBasic.UI.buttons[key]]);
		}
	},
	createHeaderButton : function(key) {
		var button = jQuery(document.createElement("span"));
		button.addClass("header-button");
		var img = this
				.createVectorImage(jQuery.fn.imagesActivesBasic.UI.buttons[key]);
		button.append(img);
		return button;
	},
	createHeaderScrollArrows : function() {
		this.leftScrollArrow = this.createHeaderScrollArrow("element-fleche-g");
		this.rightScrollArrow = this
				.createHeaderScrollArrow("element-fleche-d");
		this.title.before(this.leftScrollArrow);
		this.title.after(this.rightScrollArrow);

	},
	createHeaderScrollArrow : function(uriImg) {
		var button = this.createVectorImage(uriImg);
		button.addClass("scroll-arrow");
		return button;
	},
	createTextBox : function() {
		this.textBox = jQuery(document.createElement("div"));
		this.textBoxTitle = jQuery(document.createElement("div"));
		this.textBoxCloseButton = this.createVectorImage("close");
		this.textBoxTitle.addClass("caption_title");
		this.textBoxDesc = jQuery(document.createElement("div"));
		this.textBoxDesc.addClass("caption_text");

		this.textBox.addClass("caption_box").append(this.textBoxCloseButton)
				.append(this.textBoxTitle).append(this.textBoxDesc);
		jQuery(this.svg).before(this.textBox);
		if (this.dao.getInteractivityType() == "quiz") {
			this.textBoxTitle.after(this.createAnswerButton());
		}
		if (this.dao.getInteractivityType() == "quiz"
				&& this.dao.getSpecificInteractivityParameter("quiz_lock") == 1) {
			this.textBoxTitle.after(this.createPasswordInput());
		}
		this.hideCaption();
	},
	detailsOpacity : function(alpha) {
		var node;
		for ( var i in this.svg.childNodes) {
			node = this.svg.childNodes[i];
			if (this.isDetail(node) && !this.isPuce(node)) {
				this.detailOpacity(node, alpha);
			}
		}
	},
	detailOpacity : function(node, alpha) {
		node.setAttribute('opacity', alpha);
	},
	scale : function() {
		var nodes = this.svg.childNodes;
		var node;
		for ( var i in nodes) {
			node = nodes[i];
			if (this.isDetail(node) || this.isBackground(node)
					|| node == this.shader) {
				node.setAttribute('transform', 'scale(' + this.scaleFactor
						+ ')');
			}
		}
	},
	center : function() {

		var w = this.imageWidth * this.scaleFactor;
		var h = this.imageHeight * this.scaleFactor;
		var marginH = (window.innerWidth - w) / 2;
		var marginV = (window.innerHeight - h - jQuery.fn.imagesActivesBasic.settings.topBar) / 2;
		this.container.css("left", Math.max(0, marginH));

		this.container.css("top", this.topMargin + Math.max(0, marginV));
		this.container.css("clip", "rect(0px, 0px, " + w + "px, " + h + "px)");

	},
	lookForDetail : function(node) {
		while (!this.isDetail(node)) {
			node = node.parentNode;
			if (!node || node == this.svg)
				return null;
		}
		return node;
	},
	lookForHeaderButton : function(node) {
		for ( var key in this.headerButtons) {
			if ($(node).closest("span.header-button").is(
					this.headerButtons[key]))
				return key;
		}
		return null;
	},
	lookForTitleScrollButton : function(node) {
		if ($(node).closest(".scroll-arrow").is(this.leftScrollArrow))
			return this.leftScrollArrow;
		if ($(node).closest(".scroll-arrow").is(this.rightScrollArrow))
			return this.rightScrollArrow;
		return null;
	},
	isDetail : function(node) {
		return node && node.id != undefined
				&& node.id.match(jQuery.fn.imagesActivesBasic.patterns.DETAIL)
				&& !node.hasAttribute("empty");
	},

	isNavbarKey : function(node) {
		return node
				&& node.id != undefined
				&& node.id
						.match(jQuery.fn.imagesActivesBasic.patterns.NAVBAR_KEY);
	},
	isPuce : function(node) {
		return node.getAttribute("images_actives:puce") == "true";
	},
	isZoomable : function(node) {
		return node.getAttribute("images_actives:zoomable") == "true";
	},
	isDetailZoomable : function(key) {
		return this.isZoomable(this.detailNodes[key]);
	},
	isBackground : function(node) {
		return node && node.id != undefined && node.id == "background";
	},
	getBackgroundSize : function() {
		this.imageWidth = parseInt(this.background
				.getAttributeNS(null, "width"));
		this.imageHeight = parseInt(this.background.getAttributeNS(null,
				"height"));
		this.baseUnity = parseInt(jQuery(this.svg).imagesActivesBasic.settings.unity
				* (this.imageHeight + this.imageWidth) / 2);
	},
	displayHeader : function(display) {
		if (this.header.attr("moving") == "moving")
			return false;
		var h = this.header;
		this.header.attr("moving", "moving");
		this.headerVisible = display;
		this.updateHeaderHandleIcon();
		this.header
				.animate(
						{
							top : display ? 0 : -this.header.height()
									- this.unity
						},
						jQuery(this.svg).imagesActivesBasic.settings.panels_sliding_duration,
						function() {
							h.removeAttr("moving")
						});
		this.resizeTextBox();
		return true;
	},
	updateHeaderHandleIcon : function() {
		this.headerHandleUp.toggle(this.headerVisible);
		this.headerHandleDown.toggle(!this.headerVisible);
	},

	displayFooter : function(display) {
		if (this.footer.attr("moving") == "moving")
			return false;
		var f = this.footer;
		this.footer.attr("moving", "moving");
		this.footerVisible = display;
		this.updateFooterHandleIcon();
		this.footer
				.animate(
						{
							bottom : display ? 0 : -this.footer.height()
									- this.unity * 0.5
						},
						jQuery(this.svg).imagesActivesBasic.settings.panels_sliding_duration,
						function() {
							f.removeAttr("moving")
						});
		this.resizeTextBox();
		return true;
	},
	updateFooterHandleIcon : function() {
		this.footerHandleUp.toggle(!this.footerVisible);
		this.footerHandleDown.toggle(this.footerVisible);
	},
	displayCaption : function(detailId, title, desc) {
		this.textBoxSpace = this.detailsCaptionsAvailableSpace[detailId];
		this.textBoxTitle.text(title);
		this.textBoxDesc.html(desc);
		this.textBoxVisible = true;
		this.textBox.fadeIn();
		this.resizeTextBox();

	},
	displayAnswerButton : function(bool) {
		this.answerButton.toggle(bool);
	},
	displayPasswordInput : function(bool) {
		if (!this.passwordInput)
			return;
		this.passwordInput.toggle(bool);
		if (!bool)
			this.passwordInput.keypad('hide');
		else {
			this.passwordInput.val('');

		}
	},
	createAnswerButton : function() {
		this.answerButton = jQuery(document.createElement("input"));
		this.answerButton.attr("value", this.dao
				.getSpecificText("answer_button"));
		this.answerButton.attr("type", "button");
		this.answerButton.addClass("answer_button");
		return this.answerButton;
	},
	createPasswordInput : function() {
		this.passwordInput = jQuery(document.createElement("input"));

		this.passwordInput.attr("type", "password");
		this.passwordInput.attr("placeholder", this.dao
				.getSpecificText("password_box_label"));

		this.passwordInput.addClass("password_input");
		$.keypad.setDefaults({
			layout : [ '123', '456', '789', '0' + $.keypad.ENTER ],
			enterText : "OK",
			enterStatus : ""
		});
		this.passwordInput.keypad();

		return this.passwordInput;
	},
	hideCaption : function() {
		this.textBox.hide();
		this.textBoxVisible = false;
	},
	resizeTextBox : function() {
		if (!this.textBoxVisible)
			return;
		this.textBox.css("left", this.textBoxSpace.left * this.scaleFactor
				+ this.unity);
		var top = this.textBoxSpace.top * this.scaleFactor + this.unity;
		if (this.headerVisible)
			top += 2.5 * this.unity;
		this.textBox.css("top", top);
		this.textBox.css("width", this.textBoxSpace.width * this.scaleFactor
				- 3 * this.unity);
		this.textBoxTitle.css("font-size", this.unity * 1.2);
		this.textBoxDesc.css("font-size", this.unity * 0.9);
		if (this.passwordInput)
			this.passwordInput.css("font-size", this.unity * 0.9);
		this.textBoxDesc.css("padding-right", this.unity * 0.5);
		this.textBoxTitle.css("margin-bottom", this.unity * 0.5);
		this.textBox.children("img").width(this.unity * 1.3);
		var maxHeight = this.textBoxSpace.height * this.scaleFactor
				- this.textBoxTitle.height() - 4.5 * this.unity;
		if (this.headerVisible)
			maxHeight -= 2.5 * this.unity;
		if (this.footerVisible)
			maxHeight -= 2.5 * this.unity;
		this.textBoxDesc.css("max-height", maxHeight);
		this.textBoxDesc
				.css("overflow-y",
						this.textBoxDesc.get(0).scrollHeight > this.textBoxDesc
								.get(0).clientHeight ? "scroll" : "hidden");
		this.textBox.css("padding", this.unity / 2);
		this.textBoxDesc.css("padding-top", this.unity / 2);
		this.textBoxDesc.css("padding-bottom", this.unity / 2);
		this.textBox.css("border-radius", this.unity / 2);
		this.textBoxCloseButton.width(this.unity * 1.5);
		this.textBoxCloseButton.height(this.unity * 1.5);
		if (this.passwordInput && this.passwordInput.is(':visible'))
			this.passwordInput.keypad('show')
	},
	resizeFilter : function() {
		var shadow = document.getElementById("dropshadow");
		var feOffset = shadow.firstElementChild;
		feOffset.setAttribute("dx", this.unity * 0.75);
		feOffset.setAttribute("dy", this.unity * 0.75);
	},
	listenToInteractions : function() {

		if (this.mobile)
			for ( var event in jQuery.fn.imagesActivesBasic.mobileEvents) {
				document.addEventListener(
						jQuery.fn.imagesActivesBasic.mobileEvents[event],
						jQuery.proxy(this, "handleUserAction"), true)
			}
		else
			for ( var event in jQuery.fn.imagesActivesBasic.pcEvents) {
				document.addEventListener(
						jQuery.fn.imagesActivesBasic.pcEvents[event], jQuery
								.proxy(this, "handleUserAction"), true)
			}
	},
	handleUserAction : function(event) {
		var target = (this.mobile && event.touches) ? event.touches[0].target
				: event.target;
		if (event.type == "touchmove")
			target = document.elementFromPoint(event.pageX, event.pageY);
		var detail = this.lookForDetail(target);
		if (!detail)
			if (this.isNavbarKey(event.target)) {
				this
						.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.STOP_FOOTER_AUTOMATIC_REMOVAL);
				var detailId = event.target.id.replace("index_", "");
				detail = this.detailNodes[detailId];
			}

		switch (event.type) {
		case "mouseover":
		case "touchmove":
			if (detail)
				this.dispatchEvent(
						jQuery.fn.imagesActivesBasic.userEvents.HOVER_DETAIL, {
							detailId : detail.id
						});
			else
				this
						.dispatchEvent(
								jQuery.fn.imagesActivesBasic.userEvents.UNSELECT_DETAIL,
								{});

			break;
		case "gesturestart":
		case "gesturechange":
		case "gestureend":
			event.preventDefault();
			break;
		case "touchstart":
			this.yDepartTouche = event.pageY;
			this.xDepartTouche = event.pageX;
		case "mousedown":
			
			if (event.target==this.creditImage.get(0)) {
				window.open('http://www.crdp.ac-versailles.fr');
				return;
			} else if(this.creditPanel.is(":visible"))
				this.displayCreditPanel(false);
			if ($(event.target).hasClass("keypad-popup")
					|| $(event.target).hasClass("keypad-key")
					|| $(event.target).hasClass("keypad-row")) {
				return;
			}
			if ($(event.target).hasClass("keypad-special")) {
				this.dispatchEvent(
						jQuery.fn.imagesActivesBasic.userEvents.VALID_PASSWORD,
						{
							password : this.passwordInput.val()
						});
				return;
			}
			if (this.answerButton && event.target == this.answerButton.get(0)) {
				this
						.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ANSWER);
				return;
			}
			if (event.target == this.nextDetailButton.get(0)) {
				event.preventDefault();
				this
						.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.STOP_FOOTER_AUTOMATIC_REMOVAL);
				this.navigateInNavbar(1);

				return;
			}
			if (event.target == this.previousDetailButton.get(0)) {
				event.preventDefault();
				this
						.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.STOP_FOOTER_AUTOMATIC_REMOVAL);
				this.navigateInNavbar(-1);
				return;
			}
			if ($(event.target).closest(".close-button").is(
					this.textBoxCloseButton)
					|| $(event.target).is(this.textBoxCloseButton)) {
				event.preventDefault();
				this
						.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.HIDE_TEXT_BOX);
				return;
			}
			if ($(event.target).closest(".close-button").is(
					this.creditPanelCloseButton)
					|| $(event.target).is(this.creditPanelCloseButton)) {
				event.preventDefault();
				this.displayCreditPanel(false);
				return;
			}
			if (this.passwordInput && event.target == this.passwordInput.get(0)) {
				event.preventDefault();
				return;
			}
			if (event.target.tagName.toLowerCase() == "a") {
				return;
			}
			var buttonKey = this.lookForHeaderButton(event.target);
			switch (buttonKey) {
			case null:
				break;
			case jQuery.fn.imagesActivesBasic.UI.buttons.DETAILS:
				if (this.mobile)
					event.preventDefault();
				this
						.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ALL_DETAILS);
				return;
			case jQuery.fn.imagesActivesBasic.UI.buttons.DESCRIPTION:
				if (this.mobile)
					event.preventDefault();
				this
						.dispatchEvent(
								jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_DESCRIPTION,
								{});
				return;
			case jQuery.fn.imagesActivesBasic.UI.buttons.METADATA:
				if (this.mobile)
					event.preventDefault();
				this
						.dispatchEvent(
								jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_METADATA,
								{});
				return;
			case jQuery.fn.imagesActivesBasic.UI.buttons.INFOS:
				if (this.mobile)
					event.preventDefault();
				this.displayCreditPanel(true);
				return;
			}
			var titleScrollKey = this.lookForTitleScrollButton(event.target);
			switch (titleScrollKey) {
			case null:
				break;
			case this.leftScrollArrow:
				this.scrollTitle("left");
				break;
			case this.rightScrollArrow:
				this.scrollTitle("right");
				break;
			}

			this.yDeplacementTouche = event.pageY;
			this.xDeplacementTouche = event.pageX;
			if ($(event.target).hasClass("caption_text")) {
				if (Math.abs(this.xDeplacementTouche - this.xDepartTouche) > Math
						.abs(this.yDeplacementTouche - this.yDepartTouche)) {
					event.preventDefault();
				} else if (parseInt(event.target.scrollTop, 10)
						+ parseInt(event.target.clientHeight, 10) >= parseInt(
						event.target.scrollHeight, 10)) {
					if (this.yDepartTouche > this.yDeplacementTouche)
						event.preventDefault();
				} else if (parseInt(event.target.scrollTop, 10) < 1) {
					if (this.yDepartTouche < this.yDeplacementTouche)
						event.preventDefault();
				}
			} else if ($(event.target).hasClass("horizontal-scroll")) {
				if (Math.abs(this.xDeplacementTouche - this.xDepartTouche) < Math
						.abs(this.yDeplacementTouche - this.yDepartTouche)) {
					event.preventDefault();
				} else if (parseInt(event.target.scrollLeft, 10)
						+ parseInt(event.target.clientWidth, 10) >= parseInt(
						event.target.scrollWidth, 10)) {
					if (this.xDepartTouche > this.xDeplacementTouche)
						event.preventDefault();
				} else if (parseInt(event.target.scrollLeft, 10) < 1) {
					if (this.xDepartTouche < this.xDeplacementTouche)
						event.preventDefault();
				}
				this.updateArrows();
			} else {
				if (this.mobile)
					event.preventDefault();
			}

			if ($(event.target).closest(".bouton-header-handle").length > 0)
				this
						.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.CLICK_HEADER_TAB);
			else if ($(event.target).closest(".bouton-footer-handle").length > 0)
				this
						.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.CLICK_FOOTER_TAB);
			else if (detail)
				this.dispatchEvent(
						jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL,
						{
							detailId : detail.id
						});
			else if (event.target != this.textBox.get(0)
					&& event.target.parentElement != this.textBox.get(0))
				this
						.dispatchEvent(
								jQuery.fn.imagesActivesBasic.userEvents.CLICK_OUTSIDE_DETAIL,
								{});
			break;
		case "mouseout":
			if (detail)
				this
						.dispatchEvent(
								jQuery.fn.imagesActivesBasic.userEvents.UNSELECT_DETAIL,
								{
									detailId : detail.id
								});
			break;
		}

	},
	emphasizeAllDetails : function(bool) {
		for ( var key in this.detailNodes) {
			this.emphasizeDetail(key, bool);
		}
	},
	illuminateAllDetails : function(bool) {
		for ( var key in this.detailNodes) {
			this.illuminateDetail(key, bool);
		}
	},
	emphasizeDetail : function(detailId, bool) {
		var detail = this.detailNodes[detailId];
		if (!this.isPuce(detail)) {
			if (bool)
				this
						.displayShader(
								this.dao
										.getCommonInteractivityParameter("shading_color"),
								parseFloat(this.dao
										.getCommonInteractivityParameter("shading_alpha")),

								detailId);
			detail.getElementsByTagName("rect")[0].setAttribute("opacity",
					bool ? 0 : 1);
			detail.getElementsByTagName("image")[0].setAttribute("opacity",
					bool ? 1 : 0);
			this.detailOpacity(detail, bool ? 1 : 0);
		} else {
			this.hideShader();
			detail.setAttribute('filter', bool ? "url(#dropshadow)" : "");
		}

		this.footerContent.find("span#index_" + detailId).toggleClass(
				"emphasized", bool);
	},
	illuminateDetail : function(detailId, bool) {
		var detail = this.detailNodes[detailId];
		if (!this.isPuce(detail)) {
			detail.getElementsByTagName("rect")[0].setAttribute("opacity",
					bool ? 1 : 0);
			if (detail.getElementsByTagName("image").length > 0)
				detail.getElementsByTagName("image")[0].setAttribute("opacity",
						bool ? 0 : 1);
			detail.setAttribute("opacity", bool ? parseFloat(this.dao
					.getCommonInteractivityParameter("shading_alpha")) : 0);
			this.footerContent.find("span#index_" + detailId).toggleClass(
					"emphasized", bool);
		} else
			this.emphasizeDetail(detailId, bool);

	},
	zoomDetail : function(detailId) {

		var hProportion = (this.imageWidth - jQuery.fn.imagesActivesBasic.settings.zoom_margin
				* this.unity)
				/ this.detailsDimensions[detailId].width;
		var vProportion = (this.imageHeight - jQuery.fn.imagesActivesBasic.settings.zoom_margin
				* this.unity)
				/ this.detailsDimensions[detailId].height;
		var zoomDuration = parseFloat(this.dao
				.getCommonInteractivityParameter("zoom_duration")) / 24 * 1000;

		var proportion = Math.min(hProportion, vProportion);

		var proportion = Math.min(proportion, 1 / (this.scaleFactor / 3));
		var zoomDurationModulation = proportion / 4;
		this.zoomFactor = proportion * this.scaleFactor;
		var transX1 = -1 * this.detailsDimensions[detailId].left
				* this.zoomFactor;
		var transX2 = this.scaleFactor
				* (this.imageWidth - this.detailsDimensions[detailId].width
						* proportion) / 2;

		var transY1 = -1 * this.detailsDimensions[detailId].top
				* this.zoomFactor;
		var transY2 = this.scaleFactor
				* (this.imageHeight - this.detailsDimensions[detailId].height
						* proportion) / 2;
		this.transX = transX1 + transX2;
		this.transY = transY1 + transY2;
		this.detailNodes[detailId].getElementsByTagName("rect")[0]
				.setAttribute("opacity", "0");
		this.detailNodes[detailId].setAttribute("opacity", "1");
		this
				.displayShader(
						this.dao
								.getCommonInteractivityParameter("zoom_background_color"),
						parseFloat(this.dao
								.getCommonInteractivityParameter("zoom_background_alpha")),
						detailId);
		if (this.noZoomInterpolation) {
			this.detailNodes[detailId].setAttribute("transform", "translate("
					+ this.transX + "," + this.transY + ") " + "scale("
					+ this.zoomFactor + ") "

			);
			this.signalZoomEnd();
		} else {
			var interpolateZoomProxy = $.proxy(this, "interpolateZoom");
			this.zoom = setInterval(
					interpolateZoomProxy,
					zoomDuration
							* zoomDurationModulation
							/ jQuery.fn.imagesActivesBasic.settings.zoom_interpolation_frames);
			this.zoomProportion = 0;
			this.zoomedDetailId = detailId;
		}

	},
	interpolateZoom : function() {
		this.zoomProportion += 0.1;
		if (this.zoomProportion > 1) {
			clearInterval(this.zoom);
			this.signalZoomEnd();
			return;
		}
		this.detailNodes[this.zoomedDetailId].setAttribute("transform",
				"translate("
						+ this.easing(this.transX, this.zoomProportion)
						+ ","
						+ this.easing(this.transY, this.zoomProportion)
						+ ") "
						+ "scale("
						+ (this.easing((this.zoomFactor - this.scaleFactor),
								this.zoomProportion) + this.scaleFactor) + ") "

		);

	},
	signalZoomEnd : function() {
		this
				.dispatchEvent(jQuery.fn.imagesActivesBasic.userEvents.ZOOM_FINISHED)
	},
	easing : function(c, t) {
		var ts = t * t;
		var tc = ts * t;
		return c * (tc + -2 * ts + 2 * t);
	},
	unzoomDetail : function(detailId) {

		this.detailNodes[detailId].setAttribute("transform", "scale("
				+ this.scaleFactor + ")");
		this.detailNodes[detailId].getElementsByTagName("rect")[0]
				.setAttribute("opacity", "1");
	},
	toggleButton : function(buttonId, bool) {
		this.headerButtons[buttonId].toggleClass("emphasized", bool);
	},
	dispatchEvent : function(type, parameters) {
		jQuery(this).trigger(jQuery.Event(type, parameters));
	},
	createVectorImage : function(key) {
		var image;
		if (jQuery.fn.imagesActivesBasic.settings.embedSvgIcons == "noembed") {
			image = jQuery(document.createElement("img"));
			image.attr("src", "img/" + key + ".svg");
		} else {
			image = jQuery(document.createElement("span"));
			content = $("svg#" + key).clone();
			content.attr("id", "");
			image.append(content);
		}
		return image;
	}
};

jQuery.fn.imagesActivesBasic.Control = function(ui, dao) {

	this.ui = ui;
	this.dao = dao;
	this.quizLocked = this.dao.getInteractivityType() == "quiz"
			&& this.dao.getSpecificInteractivityParameter("quiz_lock") == 1;
	this.precedentState = this.currentState = null;
	this.selectedDetailId = "";
	this.statesIndex = jQuery.fn.imagesActivesBasic.Control.states;
	this.createStates();
	this.switchState("DEFAULT");
	this.listenToUI();
	this.displayHeaderAtStart();
	this.displayFooterAtStart();
	this.ui.fitToViewport();
};
jQuery.fn.imagesActivesBasic.Control.states = {
	DEFAULT : "Default",
	EMPHASIS_ONE : "EmphasisOne",
	DETAIL_CAPTION : "DetailCaption",
	DETAIL_QUESTION : "DetailQuestion",
	OVERALL_CAPTION : "OverallCaption",
	METADATA : "Metadata",
	ZOOM : "Zoom",
	EMPHASIZE_ALL : "EmphasisAll"

};

jQuery.fn.imagesActivesBasic.Control.prototype = {
	displayHeaderAtStart : function() {
		this.showHeader();
		this.displayHeaderAtStartTimer = setTimeout(
				jQuery.proxy(this, "hideHeader"),
				jQuery(this.svg).imagesActivesBasic.settings.panels_hiding_delay);

	},
	displayFooterAtStart : function() {
		this.showFooter();
		this.displayFooterAtStartTimer = setTimeout(
				jQuery.proxy(this, "hideFooter"),
				jQuery(this.svg).imagesActivesBasic.settings.panels_hiding_delay);

	},
	stopRemovingHeaderAtStart : function() {
		clearTimeout(this.displayHeaderAtStartTimer);
	},
	stopRemovingFooterAtStart : function() {
		clearTimeout(this.displayFooterAtStartTimer);
	},
	createStates : function() {
		var className;
		this.states = new Object();
		for ( var i in this.statesIndex) {
			className = this.statesIndex[i];
			this.states[className] = new jQuery.fn.imagesActivesBasic[className
					+ "State"](this, this.ui, this.dao);
		}
	},
	hideHeader : function() {
		if (this.ui.displayHeader(false))
			this.headerVisible = false;
	},
	showHeader : function() {
		if (this.ui.displayHeader(true))
			this.headerVisible = true;

	},
	hideFooter : function() {
		if (this.ui.displayFooter(false))
			this.footerVisible = false;
	},
	showFooter : function() {
		if (this.ui.displayFooter(true))
			this.footerVisible = true;

	},
	toggleHeader : function() {
		this.headerVisible ? this.hideHeader() : this.showHeader();
	},
	toggleFooter : function() {
		this.footerVisible ? this.hideFooter() : this.showFooter();
	},
	listenToUI : function() {
		for ( var action in jQuery.fn.imagesActivesBasic.userEvents)
			jQuery(this.ui).bind(
					jQuery.fn.imagesActivesBasic.userEvents[action],
					jQuery.proxy(this, "commonHandling"));
	},
	commonHandling : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.CLICK_HEADER_TAB:
			this.stopRemovingHeaderAtStart();
			this.toggleHeader();
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.CLICK_FOOTER_TAB:
			this.stopRemovingFooterAtStart();
			this.toggleFooter();
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.STOP_HEADER_AUTOMATIC_REMOVAL:
			this.stopRemovingHeaderAtStart();
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.STOP_FOOTER_AUTOMATIC_REMOVAL:
			this.stopRemovingFooterAtStart();
			break;
		default:
			this.specificHandling(event);
			break;
		}

	},
	specificHandling : function(event) {
		this.currentState.handleUserEvent(event);
	},
	switchState : function(newState) {
		if (this.currentState)
			this.currentState.quit();
		this.precedentState = this.currentState;
		this.currentState = this.states[jQuery.fn.imagesActivesBasic.Control.states[newState]];
		this.currentState.entry();
	},
	isComingFrom : function(state) {
		return this.precedentState
				&& this.precedentState == this.states[jQuery.fn.imagesActivesBasic.Control.states[state]];
	}
};
jQuery.fn.imagesActivesBasic.DefaultState = function(control, ui, dao) {
	this.control = control;
	this.ui = ui;
	this.dao = dao;
};
jQuery.fn.imagesActivesBasic.DefaultState.prototype = {
	handleUserEvent : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.HOVER_DETAIL:
			this.control.selectedDetailId = event.detailId;
			this.control.switchState("EMPHASIS_ONE");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ALL_DETAILS:
			this.control.switchState("EMPHASIZE_ALL");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_DESCRIPTION:
			this.control.switchState("OVERALL_CAPTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_METADATA:
			this.control.switchState("METADATA");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL:
			this.control.selectedDetailId = event.detailId;
			if (this.dao.getInteractivityType() == "discovery")
				this.control.switchState("DETAIL_CAPTION");
			else if (this.dao.getInteractivityType() == "quiz")
				this.control.switchState("DETAIL_QUESTION");
			break;
		}
	},
	entry : function() {
		if (this.control.selectedDetailId != "") {
			this.ui.emphasizeDetail(this.control.selectedDetailId, false);
			this.ui.hideShader();
		}
		this.control.selectedDetailId = "";
	},
	quit : function() {

	}
};
jQuery.fn.imagesActivesBasic.EmphasisOneState = function(control, ui, dao) {
	this.control = control;
	this.ui = ui;
	this.dao = dao;
};
jQuery.fn.imagesActivesBasic.EmphasisOneState.prototype = {
	handleUserEvent : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.UNSELECT_DETAIL:
			this.control.switchState("DEFAULT");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ALL_DETAILS:
			this.control.switchState("EMPHASIZE_ALL");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_DESCRIPTION:
			this.control.switchState("OVERALL_CAPTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_METADATA:
			this.control.switchState("METADATA");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL:
			if (event.detailId == this.control.selectedDetailId) {
				if (this.dao.getInteractivityType() == "discovery") {
					var title = this.dao
							.getDetailTitle(this.control.selectedDetailId);
					var desc = this.dao
							.getDetailDesc(this.control.selectedDetailId);
					var noCaption = (title + desc).match(/^\s*$/);
					if (noCaption) {
						if (this.ui
								.isDetailZoomable(this.control.selectedDetailId))
							this.control.switchState("ZOOM");
					}

					else
						this.control.switchState("DETAIL_CAPTION");
				} else if (this.dao.getInteractivityType() == "quiz")
					this.control.switchState("DETAIL_QUESTION");
			} else {
				this.control.selectedDetailId = event.detailId;
				this.control.switchState("EMPHASIS_ONE");
			}
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.HOVER_DETAIL:
			if (event.detailId != this.control.selectedDetailId) {
				this.control.selectedDetailId = event.detailId;
				this.control.switchState("EMPHASIS_ONE");
			}
			break;
		}
	},
	entry : function() {
		this.ui.emphasizeAllDetails(false);
		this.ui.emphasizeDetail(this.control.selectedDetailId, true);
	},
	quit : function() {

	}
};
jQuery.fn.imagesActivesBasic.DetailCaptionState = function(control, ui, dao) {
	this.control = control;
	this.ui = ui;
	this.dao = dao;
};
jQuery.fn.imagesActivesBasic.DetailCaptionState.prototype = {
	handleUserEvent : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.UNSELECT_DETAIL:
			if (this.ui.mobile)
				this.control.switchState("DEFAULT");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.CLICK_OUTSIDE_DETAIL:
			this.control.switchState("DEFAULT");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ALL_DETAILS:
			this.control.switchState("EMPHASIZE_ALL");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_DESCRIPTION:
			this.control.switchState("OVERALL_CAPTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_METADATA:
			this.control.switchState("METADATA");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL:
			if (event.detailId == this.control.selectedDetailId) {
				if (this.ui.isDetailZoomable(this.control.selectedDetailId))
					this.control.switchState("ZOOM");
				else
					this.control.switchState("DEFAULT");
			} else {
				this.control.selectedDetailId = event.detailId;
				if (this.dao.getInteractivityType() == "discovery")
					this.control.switchState("DETAIL_CAPTION");
				else if (this.dao.getInteractivityType() == "quiz")
					this.control.switchState("DETAIL_QUESTION");
			}
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.HIDE_TEXT_BOX:
			this.control.switchState("DEFAULT");
			break;
		}
	},
	entry : function() {
		if (!this.control.isComingFrom("EMPHASIS_ONE")) {
			this.ui.emphasizeAllDetails(false);
			this.ui.emphasizeDetail(this.control.selectedDetailId, true);
		}
		var title = this.dao.getDetailTitle(this.control.selectedDetailId);
		var desc = this.dao.getDetailDesc(this.control.selectedDetailId);
		var noCaption = (title + desc).match(/^\s*$/);
		if (!noCaption)
			this.ui.displayCaption(this.control.selectedDetailId, title, desc)
	},
	quit : function() {
		this.ui.hideCaption();
	}
};
jQuery.fn.imagesActivesBasic.DetailQuestionState = function(control, ui, dao) {
	this.control = control;
	this.ui = ui;
	this.dao = dao;
};
jQuery.fn.imagesActivesBasic.DetailQuestionState.prototype = {
	handleUserEvent : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.UNSELECT_DETAIL:
			if (this.ui.mobile)
				this.control.switchState("DEFAULT");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.CLICK_OUTSIDE_DETAIL:
			this.control.switchState("DEFAULT");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ALL_DETAILS:
			this.control.switchState("EMPHASIZE_ALL");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_DESCRIPTION:
			this.control.switchState("OVERALL_CAPTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_METADATA:
			this.control.switchState("METADATA");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ANSWER:
			this.answerDisplayed = true;
			this.refreshTextBox();
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.VALID_PASSWORD:
			this.validatePasswordInput(event.password);
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL:
			if (event.detailId == this.control.selectedDetailId) {
				if (this.ui.isDetailZoomable(this.control.selectedDetailId))
					this.control.switchState("ZOOM");
				else
					this.control.switchState("DEFAULT");
			} else {
				this.control.selectedDetailId = event.detailId;
				if (this.dao.getInteractivityType() == "discovery")
					this.control.switchState("DETAIL_CAPTION");
				else if (this.dao.getInteractivityType() == "quiz")
					this.control.switchState("DETAIL_QUESTION");
			}
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.HIDE_TEXT_BOX:
			this.control.switchState("DEFAULT");
			break;
		}
	},
	validatePasswordInput : function(passwd) {
		if (this.dao.getSpecificInteractivityParameter("quiz_password") == passwd) {
			this.control.quizLocked = false;
			this.answerDisplayed = true;
		}

		this.refreshTextBox();
	},
	entry : function() {
		if (!this.control.isComingFrom("EMPHASIS_ONE")) {
			this.ui.emphasizeAllDetails(false);
			this.ui.emphasizeDetail(this.control.selectedDetailId, true);
		}
		this.answerDisplayed = false;
		this.refreshTextBox();
	},
	refreshTextBox : function() {
		var desc = "";
		var title = this.dao.getDetailTitle(this.control.selectedDetailId);
		if (this.answerDisplayed) {
			desc = this.dao.getDetailDesc(this.control.selectedDetailId);

		} else {
			desc = "";
		}

		this.ui.displayPasswordInput(this.control.quizLocked);
		if (this.control.quizLocked)
			this.control.stopRemovingHeaderAtStart();
		this.ui.displayAnswerButton(!this.answerDisplayed
				&& !this.control.quizLocked);
		this.ui.displayCaption(this.control.selectedDetailId, title, desc,
				!this.answerDisplayed);
	},
	quit : function() {

		if (this.ui.passwordInput)
			this.ui.displayPasswordInput(false);
		if (this.ui.answerButton)
			this.ui.displayAnswerButton(false);
		this.ui.hideCaption();
	}
};
jQuery.fn.imagesActivesBasic.OverallCaptionState = function(control, ui, dao) {
	this.control = control;
	this.ui = ui;
	this.dao = dao;
};
jQuery.fn.imagesActivesBasic.OverallCaptionState.prototype = {
	handleUserEvent : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.CLICK_OUTSIDE_DETAIL:
			this.control.switchState("DEFAULT");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ALL_DETAILS:
			this.control.switchState("EMPHASIZE_ALL");
			break;

		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_METADATA:
			this.control.switchState("METADATA");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL:
			this.control.selectedDetailId = event.detailId;
			if (this.dao.getInteractivityType() == "discovery")
				this.control.switchState("DETAIL_CAPTION");
			else if (this.dao.getInteractivityType() == "quiz")
				this.control.switchState("DETAIL_QUESTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.HIDE_TEXT_BOX:
			this.control.switchState("DEFAULT");
			break;

		}
	},
	entry : function() {
		this.control.stopRemovingHeaderAtStart();
		if (!this.control.isComingFrom("EMPHASIS_ONE")) {
			this.ui.emphasizeAllDetails(false);
			this.control.selectedDetailId = "";
			this.ui.hideShader();
		}
		var title = "";
		var desc = "";
		if (this.dao.getInteractivityType() == "discovery") {
			title = this.dao
					.getDetailTitle(jQuery.fn.imagesActivesBasic.DAO.OVERALL_DESCRIPTION);
			desc = this.dao
					.getDetailDesc(jQuery.fn.imagesActivesBasic.DAO.OVERALL_DESCRIPTION);
		} else if (this.dao.getInteractivityType() == "quiz") {
			title = this.dao.getSpecificText("quiz_instruction_title");
			desc = this.dao.getSpecificText("quiz_instruction_text");
		}
		if (this.ui.passwordInput)
			this.ui.displayPasswordInput(false);
		if (this.ui.answerButton)
			this.ui.displayAnswerButton(false);

		this.ui.displayCaption(
				jQuery.fn.imagesActivesBasic.DAO.OVERALL_DESCRIPTION, title,
				desc)
	},
	quit : function() {
		this.ui.hideCaption();
	}
};
jQuery.fn.imagesActivesBasic.MetadataState = function(control, ui, dao) {
	this.control = control;
	this.ui = ui;
	this.dao = dao;
};
jQuery.fn.imagesActivesBasic.MetadataState.prototype = {
	handleUserEvent : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.CLICK_OUTSIDE_DETAIL:
			this.control.switchState("DEFAULT");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ALL_DETAILS:
			this.control.switchState("EMPHASIZE_ALL");
			break;

		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_DESCRIPTION:
			this.control.switchState("OVERALL_CAPTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL:
			this.control.selectedDetailId = event.detailId;
			if (this.dao.getInteractivityType() == "discovery")
				this.control.switchState("DETAIL_CAPTION");
			else if (this.dao.getInteractivityType() == "quiz")
				this.control.switchState("DETAIL_QUESTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.HIDE_TEXT_BOX:
			this.control.switchState("DEFAULT");
			break;
		}
	},
	entry : function() {
		this.control.stopRemovingHeaderAtStart();
		if (!this.control.isComingFrom("EMPHASIS_ONE")) {
			this.ui.emphasizeAllDetails(false);
			this.control.selectedDetailId = "";
			this.ui.hideShader();
		}
		if (this.ui.passwordInput)
			this.ui.displayPasswordInput(false);
		if (this.ui.answerButton)
			this.ui.displayAnswerButton(false);
		this.ui.displayCaption(
				jQuery.fn.imagesActivesBasic.DAO.OVERALL_DESCRIPTION, this.dao
						.getMetadataTitle(), this.dao.getMetadataContent())
	},
	quit : function() {
		this.ui.hideCaption();
	}
};
jQuery.fn.imagesActivesBasic.ZoomState = function(control, ui, dao) {
	this.control = control;
	this.ui = ui;
	this.dao = dao;
};
jQuery.fn.imagesActivesBasic.ZoomState.prototype = {
	handleUserEvent : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL:
		case jQuery.fn.imagesActivesBasic.userEvents.CLICK_OUTSIDE_DETAIL:
			if (!this.zoomRunning)
				this.control.switchState("DEFAULT");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.ZOOM_FINISHED:
			this.zoomRunning = false;
			break;
		default:
			break;
		}
	},
	entry : function() {
		this.zoomRunning = true;
		this.ui.footer.hide();
		this.ui.footerHandleUp.hide();
		this.ui.footerHandleDown.hide();
		this.ui.header.hide();
		this.ui.headerHandleUp.hide();
		this.ui.headerHandleDown.hide();
		this.ui.zoomDetail(this.control.selectedDetailId);
	},
	quit : function() {
		this.ui.footer.show();
		this.ui.updateFooterHandleIcon();
		this.ui.header.show();
		this.ui.updateHeaderHandleIcon();
		this.ui.unzoomDetail(this.control.selectedDetailId);
	}
};
jQuery.fn.imagesActivesBasic.EmphasisAllState = function(control, ui, dao) {
	this.control = control;
	this.ui = ui;
	this.dao = dao;
};
jQuery.fn.imagesActivesBasic.EmphasisAllState.prototype = {
	handleUserEvent : function(event) {
		switch (event.type) {
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_ALL_DETAILS:
			this.control.switchState("DEFAULT");
			return;
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_DESCRIPTION:
			this.control.switchState("OVERALL_CAPTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.DISPLAY_METADATA:
			this.control.switchState("METADATA");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.SELECT_DETAIL:
			this.control.selectedDetailId = event.detailId;
			if (this.dao.getInteractivityType() == "discovery")
				this.control.switchState("DETAIL_CAPTION");
			else if (this.dao.getInteractivityType() == "quiz")
				this.control.switchState("DETAIL_QUESTION");
			break;
		case jQuery.fn.imagesActivesBasic.userEvents.HOVER_DETAIL:
			break;
		default:
			this.control.switchState("DEFAULT");
			break;
		}
	},
	entry : function() {
		this.control.stopRemovingHeaderAtStart();
		this.ui.hideShader();
		this.ui.illuminateAllDetails(true);
		this.ui.toggleButton(jQuery.fn.imagesActivesBasic.UI.buttons.DETAILS,
				true);
	},
	quit : function() {
		this.ui.illuminateAllDetails(false);
		this.ui.toggleButton(jQuery.fn.imagesActivesBasic.UI.buttons.DETAILS,
				false);
	}
};
