/*
*
* Card			: dev-swiss-army-knife-card.js
* Project   : Home Assistant
* Repository: https://github.com/AmoebeLabs/
*
* Author    : Mars @ AmoebeLabs.com
* 
* License   : MIT
*
* -----
* Description:
*   The swiss army knife card.
*
* Refs:
*   - https://github.com/AmoebeLabs/swiss-army-knife
*   
*******************************************************************************
*/

import {
  LitElement, html, css, svg
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

import {
	unsafeHTML
} from "https://unpkg.com/lit-html/directives/unsafe-html.js?module";

import {
	unsafeSVG
} from "https://unpkg.com/lit-html/directives/unsafe-svg.js?module";

//++ Consts ++++++++++

const FONT_SIZE = 12;
const SVG_DEFAULT_DIMENSIONS = 200;
const SVG_VIEW_BOX = SVG_DEFAULT_DIMENSIONS;//200;
const SVG_VIEW_BOX_HEIGHT = 1 * SVG_DEFAULT_DIMENSIONS; //200
const SVG_VIEW_BOX_WIDTH = 2 * SVG_DEFAULT_DIMENSIONS;//400;

//--

//++ Class ++++++++++

// https://github.com/hoangnd25/cacheJS
// http://hoangnd.me/blog/cache-your-data-with-javascript-using-cachejs
// Voor caching van data... Deze gebruiken???

//=============================================================================
//=============================================================================
//=============================================================================

 /*******************************************************************************
	* Utils class
	*
	* Summary.
	*
	*/

class Utils {
	
 /*******************************************************************************
	* _calculateValueBetween()
	*
	* Summary.
	*	Clips the val value between start and end, and returns the between value ;-)
	*
	*/

  static calculateValueBetween(argStart, argEnd, argVal) {
    return (Math.min(Math.max(argVal, argStart), argEnd) - argStart) / (argEnd - argStart);
  }
	
	// Calculate own (tool/tool) coordinates relative to centered toolset position.
	// Tool coordinates are %
	//
	// Group is 50,40. Say SVG is 200x200. Group is 100,80 within 200x200.
	// Tool is 10,50. 0.1 * 200 = 20 + (100 - 200/2) = 20 + 0.
	static calculateCoordinate(argOwn, argToolset) {

		return (argOwn / 100) * (SVG_DEFAULT_DIMENSIONS)
						+ (argToolset - SVG_DEFAULT_DIMENSIONS/2);
	}

	
	static calculateDimension(argDimension) {
		return (argDimension / 100) * (SVG_DEFAULT_DIMENSIONS);
	}
}

 /*******************************************************************************
	* Templates class
	*
	* Summary.
	*
	*/
	
class Templates {
	
 /*******************************************************************************
	* replaceVariables()
	*
	* Summary.
	*	A toolset defines a template. This template is found and passed as argToolsetTemplate.
	* This is actually a set of tools, nothing else...
	* Also passed is the list of variables that should be replaced:
	*	- The list defined in the toolset
	*	- The defaults defined in the template itself, which are defined in the argToolsetTemplate
	*
	*/
	static replaceVariables(argVariables, argToolsetTemplate) {

		if (!argVariables && !argToolsetTemplate.defaults) {
			return argToolsetTemplate.tools;
		}
		let variableArray = argVariables?.slice(0) ?? [];
		
		if (argToolsetTemplate.defaults) {
			variableArray = variableArray.concat(argToolsetTemplate.defaults);
		}
		let jsonConfig = JSON.stringify(argToolsetTemplate.tools);
		variableArray.forEach(variable => {
			const key = Object.keys(variable)[0];
			const value = Object.values(variable)[0];
			if (typeof value === 'number' || typeof value === 'boolean') {
				const rxp2 = new RegExp(`"\\[\\[${key}\\]\\]"`, 'gm');
				jsonConfig = jsonConfig.replace(rxp2, value);
			}
			if (typeof value === 'object') {
				const rxp2 = new RegExp(`"\\[\\[${key}\\]\\]"`, 'gm');
				const valueString = JSON.stringify(value);
				jsonConfig = jsonConfig.replace(rxp2, valueString);
			} else {
				const rxp = new RegExp(`\\[\\[${key}\\]\\]`, 'gm');
				jsonConfig = jsonConfig.replace(rxp, value);
			}
		});
		return JSON.parse(jsonConfig);		
	}
	
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

class BaseTool {
	constructor(argParent, argConfig, argPos) {

		this.toolId = Math.random().toString(36).substr(2, 9);
		this._parent = argParent;
		
		this.debug = this._parent.config.debug;
		console.log('BaseTool - debug', this.debug);
		
		// The position is the absolute position of the GROUP within the svg viewport.
		// The tool is positioned relative to this origin. A tool is always relative
		// to a 200x200 default svg viewport. A (50,50) position of the tool
		// centers the tool on the absolute position of the GROUP!
		this.toolsetPos = argPos;

		// Calculate real positions depending on aspectRatio and position...
		// Positions are ALWAYS centered!
		this.coords = {};
		this.coords.cx = Utils.calculateCoordinate(argConfig.cx, this.toolsetPos.cx);
		this.coords.cy = Utils.calculateCoordinate(argConfig.cy, this.toolsetPos.cy);

		this.dimensions = {};
		this.dimensions.height = argConfig.height ? Utils.calculateDimension(argConfig.height) : 0;
		this.dimensions.width = argConfig.width ? Utils.calculateDimension(argConfig.width) : 0;

		// Get SVG coordinates.
		this.svg = {};
		this.svg.x = (this.coords.cx) - (this.dimensions.width / 2);
		this.svg.y = (this.coords.cy) - (this.dimensions.height / 2);
		
		// Group scaling experiment. Calc translate values for SVG using the toolset scale value
		let scalex = this.coords.cx * this.toolsetPos.scale;
		let scaley = this.coords.cy * this.toolsetPos.scale;
		let diffx = this.coords.cx - scalex;
		let diffy = this.coords.cy - scaley;
		this.dimensions.xlateX = diffx / this.toolsetPos.scale;
		this.dimensions.xlateY = diffy / this.toolsetPos.scale;		
	}
}

 /*******************************************************************************
	* RangeSliderTool class
	*
	* Summary.
	*
	*/

class RangeSliderTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {


		const DEFAULT_SLIDER_CONFIG = {
				type: 'horizontal',
				styles: {
					"slider": {
						"stroke-linecap": 'round;',
						"stroke": 'var(--primary-text-color);',
						"opacity": '1.0;',
						"stroke-width": '2;'
					},
				}
		}

		super(argParent, argConfig, argPos);
		
		this.config = {...DEFAULT_SLIDER_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_SLIDER_CONFIG.styles, ...this.config.styles};

		if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_SLIDER_CONFIG.show, ...this.config.show};

		this.config.entity_index = this.config.entity_index ? this.config.entity_index : 0;
		
		this.dimensions.length = Utils.calculateDimension(argConfig.length)

		if (this.config.type == 'vertical') {
			this.svg.x1 = this.coords.cx;
			this.svg.y1 = this.coords.cy - this.dimensions.length/2;
			this.svg.x2 = this.coords.cx;
			this.svg.y2 = this.coords.cy + this.dimensions.length/2;
		} else {
			this.svg.x1 = this.coords.cx - this.dimensions.length/2;
			this.svg.y1 = this.coords.cy;
			this.svg.x2 = this.coords.cx + this.dimensions.length/2;
			this.svg.y2 = this.coords.cy;
		}

	// Specific rangeslider stuff...
		this.elements = {};
		this.svgH = 40;
    this.deformation = this.svgH/2;
    this.target = this.svgH/4;
    this._value = 0;
    this.dragging = false;

		this.SVG_NS = "http://www.w3.org/2000/svg";
		this.SVG_XLINK = "http://www.w3.org/1999/xlink";
		this.rid = null;
		this.m = { x: 100, y: this.svg.y + this.svgH / 2 };
		

	//--

		if (this.debug) console.log('RangeSliderTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

  updateValue() {
    let dist = this.target - this._value;
    let vel = dist / 10;
    this._value += vel;
    //improvement
    if (Math.abs(dist) < 0.01) {
      if (this.rid) {
        window.cancelAnimationFrame(this.rid);
        this.rid = null;
      }
    }
  }

  updatePath(m) {
    this.d = this.curvedPath(m.x, this.svg.y + this.svgH / 2, this.deformation, this._value);
    this.elements.path.setAttributeNS(null, "d", this.d);

    this.elements.thumb.setAttributeNS(null, "r", 1 + this._value / 3);
    this.elements.thumb.setAttributeNS(null, "cx", m.x);

    this.updateLabel(m);
    this.updateInput(m);
  }

  updateLabel2(m) {
    this.elements.label.setAttributeNS(
      null,
      "transform",
      `translate(${m.x}, ${this.svg.y + this.svgH / 1 - this._value}) scale(2)`
    );

    this.elements.text.textContent = Math.round(m.x);
  }
  
  updateLabel(m) {
    this.elements.label.setAttributeNS(
      null,
      "transform",
      `translate(${m.x - 30},${this.svg.y - this.svgH / 100 - this._value}) scale(2)`
    );

    this.elements.text.textContent = Math.round(m.x);
  }
  
	updateInput(m) {
    //this.inputElement.value = Math.round(m.x);
  }


	 oMousePosSVG(e) {
		var p = this.elements.svg.createSVGPoint();
		p.x = e.clientX;
		p.y = e.clientY;
		var ctm = this.elements.svg.getScreenCTM().inverse();
		var p = p.matrixTransform(ctm);
		return p;
	}



	// HELPERS

	 curvedPath(X, Y, defX, defY) {
		//let def = 5;//deformation
		//let Y = 20;
		//let X = mouse position
		let D = { cx: Math.max(20, Math.min(X, 200)), cy: Y - defY, r: 1 };
		let B = { cx: Math.max(20, Math.min(D.cx - defX, 100)), cy: Y, r: 1 };
		let F = { cx: Math.max(20, Math.min(D.cx + defX, 100)), cy: Y, r: 1 };
		let A = { cx: Math.max(20, Math.min(D.cx - 2 * defX, 100)), cy: Y, r: 1 };
		let G = { cx: Math.max(20, Math.min(D.cx + 2 * defX, 100)), cy: Y, r: 1 };

		let C = this.interpolatePoint(B, D, 1, 2);
		C.r = 1;
		let E = this.interpolatePoint(D, F, 1, 2);
		E.r = 1;

		return `M0,${Y} L${A.cx},${A.cy}
								Q${B.cx},${B.cy} ${C.cx},${C.cy}
								Q${D.cx},${D.cy} ${E.cx},${E.cy}
								Q${F.cx},${F.cy} ${G.cx},${G.cy}
								L100,${A.cy}
	`;
	}

	 interpolatePoint(a, b, i, n) {
		//point a
		//point b
		//line divided in n segments
		//find the i-th point
		var o = {
			cx: a.cx + (b.cx - a.cx) * (i / n),
			cy: a.cy + (b.cy - a.cy) * (i / n)
		};
		return o;
	}

	firstUpdated(changedProperties)
	{
		const thisValue = this;

		function Frame() {
			thisValue.rid = window.requestAnimationFrame(Frame);
			thisValue.updateValue();
			thisValue.updatePath(thisValue.m);
			//if (this.debug) console.log('pointer in Frame', thisValue.m);
		}
		
		if (this.debug) console.log('slider - firstUpdated');
		// #TODO
		// svg moet een svg object zijn, want er worden functies op uitgevoerd.
		// dus deze slider moet een eigen svg element krijgen...
		this.elements.svg = this._parent.shadowRoot.getElementById("rangeslider-".concat(this.toolId));

//		this.svg = document.querySelector("svg");
    this.elements.path = this.elements.svg.querySelector("path");
    this.elements.thumb = this.elements.svg.querySelector("circle");
//    this.thumb = _2.querySelector("circle");

		if (true) {
			this.elements.label = this.elements.svg.querySelector("#_2 path");
			this.elements.text = this.elements.svg.querySelector("#_2 text textPath");
		} else {
			this.elements.label = this.elements.svg.querySelector("#_2 rect");
			this.elements.text = this.elements.svg.querySelector("#_2 text");
		}

		if (this.debug) console.log('slider - firstUpdated svg = ', this.elements.svg, 'path=', this.elements.path, 'thumb=', this.elements.thumb, 'label=', this.elements.label, 'text=', this.elements.text);

//    this.inputElement = witness; ////

		
    this.elements.svg.addEventListener("pointerdown", e => {
      this.dragging = true;
      this.m = this.oMousePosSVG(e);
			this.m.x = Math.round(this.m.x / 5) * 5;
      if (this.debug) console.clear();
      if (this.debug) console.log('pointerDOWN',Math.round(this.m.x * 100) / 100);
      this.target = this.svgH/.75;
      Frame();
    });

    this.elements.svg.addEventListener("pointerup", () => {
      this.dragging = false;
      this.target = 0;
      if (this.debug) console.log('pointerUP');
      Frame();
      //this.updatePath(m,deformation);
    });

    this.elements.svg.addEventListener("pointerout", () => {

      this.dragging = false;
      this.target = 0;
      if (this.debug) console.log('pointerOUT');
      Frame();
    });

    this.elements.svg.addEventListener("pointermove", e => {
      if (this.dragging) {
        this.m = this.oMousePosSVG(e);
				this.m.x = Math.max(10, Math.min(this.m.x, 90.0));
				this.m.x = Math.round(this.m.x / 5) * 5;

        console.clear();
        if (this.debug) console.log('pointerMOVE', this.m.x, Math.round(this.m.x * 100) / 100);
        this.target = this.svgH/.75;
        Frame();
      }
    });

	}

 /*******************************************************************************
	* _renderRangeSlider()
	*
	* Summary.
	*	Renders the range slider
	*
	*/

  _renderRangeSlider() {

		if (this.debug) console.log('slider - _renderRangeSlider');

		// Get configuration styles as the default styles
		let configStyle = {...this.config.styles};
		
		// Get the runtime styles, caused by states & animation settings
		let stateStyle = {};
		if (this._parent.animations.lines[this.config.animation_id])
			stateStyle = Object.assign(stateStyle, this._parent.animations.lines[this.config.animation_id]);

		// Merge the two, where the runtime styles may overwrite the statically configured styles
		configStyle = { ...configStyle, ...stateStyle};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");
		
		const toRender = []
		//toRender.push(html`<input type="range" id="witness" value="50" disabled style="display:none">`);

		toRender.push(svg`
				<g id="poep" >
					<rect x="0" y="100" width="100" height="80" style="fill: none" pointer-events="all"/>
					
					<path d="M0,200 L150,200" stroke="grey" stroke-width="10" pointer-events="none" stroke-linecap="round"/>
					<g id="_2" pointer-events="none">
						<path id="label" transform="translate(100,220) scale(5)" d="M 0 0 h 30 v 20 h -30 v -20" style="fill: white; stroke: grey; stroke-width:2"/>

						<circle cy="${this.svg.y + 20}" r="2" fill="white" pointer-events="none"/>

						<text text-anchor="middle" transform="translate(0,10)" pointer-events="none" >
						<textPath startOffset="15%" dominant-baseline="hanging" fill="black" font-size="2em" font-weight="700" xlink:href="#label" pointer-events="none">
            50
						</textPath>
					</g>
				</g>
			`);
/*
		toRender.push(svg`
				<g id="poep" >
					<rect x="0" y="100" width="100" height="80"style="fill: none" pointer-events="all"/>
					<path d="M0,200 L150,200" stroke="grey" stroke-width="10" pointer-events="none" stroke-linecap="round"/>
					<g id="_2" pointer-events="none">
						<path id="label" transform="translate(100,220) scale(5)" d="M0.89,-1.79 Q0,0 -0.89,-1.79L-1.10,-2.21 Q-2,-4 -4,-4L-5,-4 Q-7,-4 -7,-6L-7,-10 Q-7,-12 -5,-12L5,-12 Q7,-12 7,-10L7,-6 Q7,-4 5,-4L4,-4 Q2,-4 1.1,-2.21Z" />
				
						<circle cy="${this.svg.y + 20}" r="2" fill="white" pointer-events="none"/>

						<text text-anchor="middle" transform="translate(0,10)" pointer-events="none" >
						<textPath startOffset="53.5%" dominant-baseline="hanging" fill="white" font-size="2em" xlink:href="#label" pointer-events="none">
            50
						</textPath>
					</g>
				</g>
			`);
*/
		return toRender;
	}	

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	*/
	render() {

    return svg`
			<svg viewbox="-10,-100,400,400" id="rangeslider-${this.toolId}" class="rangeslider" pointer-events="all"
			>
				${this._renderRangeSlider()}
			</svg>
		`;

    return svg`
			<g id="rangeslider-${this.toolId}" class="rangeslider"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderRangeSlider()}
			</g>
		`;

	}	
} // END of class


 /*******************************************************************************
	* LineTool class
	*
	* Summary.
	*
	*/

class LineTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_LINE_CONFIG = {
				type: 'vertical',
				styles: {
					"stroke-linecap": 'round;',
					"stroke": 'var(--primary-text-color);',
					"opacity": '1.0;',
					"stroke-width": '2;'
				}
		}

		super(argParent, argConfig, argPos);
		
		this.config = {...DEFAULT_LINE_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_LINE_CONFIG.styles, ...this.config.styles};

		if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_LINE_CONFIG.show, ...this.config.show};

		this.config.entity_index = this.config.entity_index ? this.config.entity_index : 0;
		
		if ((this.config.type == 'vertical') || (this.config.type == 'horizontal'))
				this.dimensions.length = Utils.calculateDimension(argConfig.length);

		if (this.config.type == 'fromto') {
			this.coords.x1 = Utils.calculateCoordinate(argConfig.x1, this.toolsetPos.cx);
			this.coords.y1 = Utils.calculateCoordinate(argConfig.y1, this.toolsetPos.cy);
			this.coords.x2 = Utils.calculateCoordinate(argConfig.x2, this.toolsetPos.cx);
			this.coords.y2 = Utils.calculateCoordinate(argConfig.y2, this.toolsetPos.cy);
		}

		// #TODO: replace coords.cx by coords.cx to denote the CENTER position, as opposed to the x1,y1 etc. positions.
		// Makes it also clear that the given pos is centered. Should also be in the yaml files. Makes it much more clear
		// Then text & icon are bx,by, ie baseline sort of positions.
		if (this.config.type == 'vertical') {
			this.svg.x1 = this.coords.cx;
			this.svg.y1 = this.coords.cy - this.dimensions.length/2;
			this.svg.x2 = this.coords.cx;
			this.svg.y2 = this.coords.cy + this.dimensions.length/2;
		} else if (this.config.type == 'horizontal') {
			this.svg.x1 = this.coords.cx - this.dimensions.length/2;
			this.svg.y1 = this.coords.cy;
			this.svg.x2 = this.coords.cx + this.dimensions.length/2;
			this.svg.y2 = this.coords.cy;
		} else if (this.config.type == 'fromto') {
			this.svg.x1 = this.coords.x1;
			this.svg.y1 = this.coords.y1;
			this.svg.x2 = this.coords.x2;
			this.svg.y2 = this.coords.y2;
		}
		if (this.debug) console.log('LineTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

 /*******************************************************************************
	* _renderLine()
	*
	* Summary.
	*	Renders the line using precalculated coordinates and dimensions.
	* Only the runtime style is calculated before rendering the line
	*
	*/

  _renderLine() {

		// Get configuration styles as the default styles
		let configStyle = {...this.config.styles};
		
		// Get the runtime styles, caused by states & animation settings
		let stateStyle = {};
		if (this._parent.animations.lines[this.config.animation_id])
			stateStyle = Object.assign(stateStyle, this._parent.animations.lines[this.config.animation_id]);

		// Merge the two, where the runtime styles may overwrite the statically configured styles
		configStyle = { ...configStyle, ...stateStyle};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");
		
		if (this.debug) console.log('_renderLine POEP', this.config.type, this.svg.x1, this.svg.y1, this.svg.x2, this.svg.y2);
		return svg`
			<line
				x1="${this.svg.x1}"
				y1="${this.svg.y1}"
				x2="${this.svg.x2}"
				y2="${this.svg.y2}"
				style="${configStyleStr}"/>
			`;
	}	

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	*/
	render() {

    return svg`
			<g id="line-${this.toolId}" class="line"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderLine()}
			</g>
		`;

	}	
} // END of class

 /*******************************************************************************
	* CircleTool class
	*
	* Summary.
	*
	*/

class CircleTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_CIRCLE_CONFIG = {
				cx: 50,
				cy: 50,
				radius: 50,
		}

		super(argParent, argConfig, argPos);
		
		this.config = {...DEFAULT_CIRCLE_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_CIRCLE_CONFIG.styles, ...this.config.styles};

		if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_CIRCLE_CONFIG.show, ...this.config.show};

		this.config.entity_index = this.config.entity_index ? this.config.entity_index : 0;
		
		this.dimensions.radius = Utils.calculateDimension(argConfig.radius)

		if (this.debug) console.log('CircleTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

 /*******************************************************************************
	* _renderCircle()
	*
	* Summary.
	*	Renders the circle using precalculated coordinates and dimensions.
	* Only the runtime style is calculated before rendering the circle
	*
	*/

  _renderCircle() {

		// Get configuration styles as the default styles
		let configStyle = {...this.config.styles};
		
		// Get the runtime styles, caused by states & animation settings
		let stateStyle = {};
		if (this._parent.animations.circles[this.config.animation_id])
			stateStyle = Object.assign(stateStyle, this._parent.animations.circles[this.config.animation_id]);

		// Merge the two, where the runtime styles may overwrite the statically configured styles
		configStyle = { ...configStyle, ...stateStyle};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");
		
		return svg`
			<circle filter="url(#ds)"
				cx="${this.coords.cx}"% cy="${this.coords.cy}"% r="${this.dimensions.radius}"
				style="${configStyleStr}"/>					
			`;
	}	

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	*/
	render() {

    return svg`
			<g filter="url(#ds)" id="circle-${this.toolId}" class="circle"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderCircle()}
			</g>
		`;

	}	
} // END of class

 /*******************************************************************************
	* EllipseTool class
	*
	* Summary.
	*
	*/

class EllipseTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_ELLIPSE_CONFIG = {
				cx: 50,
				cy: 50,
				radiusx: 50,
				radiusy: 25,
		}

		super(argParent, argConfig, argPos);
		
		this.config = {...DEFAULT_ELLIPSE_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_ELLIPSE_CONFIG.styles, ...this.config.styles};

		if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_ELLIPSE_CONFIG.show, ...this.config.show};

		this.config.entity_index = this.config.entity_index ? this.config.entity_index : 0;
		
		this.dimensions.radiusx = Utils.calculateDimension(argConfig.radiusx)
		this.dimensions.radiusy = Utils.calculateDimension(argConfig.radiusy)

		if (this.debug) console.log('EllipseTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

 /*******************************************************************************
	* _renderEllipse()
	*
	* Summary.
	*	Renders the ellipse using precalculated coordinates and dimensions.
	* Only the runtime style is calculated before rendering the ellipse
	*
	*/

  _renderEllipse() {

		// Get configuration styles as the default styles
		let configStyle = {...this.config.styles};
		
		// Get the runtime styles, caused by states & animation settings
		let stateStyle = {};
		if (this._parent.animations.circles[this.config.animation_id])
			stateStyle = Object.assign(stateStyle, this._parent.animations.circles[this.config.animation_id]);

		// Merge the two, where the runtime styles may overwrite the statically configured styles
		configStyle = { ...configStyle, ...stateStyle};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");
		if (this.debug) console.log('EllipseTool - renderEllipse', this.coords.cx, this.coords.cy, this.dimensions.radiusx, this.dimensions.radiusy);

		return svg`
			<ellipse filter="url(#ds)"
				cx="${this.coords.cx}"% cy="${this.coords.cy}"%
				rx="${this.dimensions.radiusx}" ry="${this.dimensions.radiusy}"
				style="${configStyleStr}"/>					
			`;
	}	

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	*/
	render() {

    return svg`
			<g filter="url(#ds)" id="ellipse-${this.toolId}" class="ellipse"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderEllipse()}
			</g>
		`;

	}	
} // END of class


/*******************************************************************************
	* EntityIconTool class
	*
	* Summary.
	*
	*/

class EntityIconTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_ICON_CONFIG = {
				styles: {
					"--mdc-icon-size": '100%;',
					"align-self": 'center;',
					"height": '100%;',
					"width": '100%;',
				}
		}
		super(argParent, argConfig, argPos);
		
		this.config = {...DEFAULT_ICON_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_ICON_CONFIG.styles, ...this.config.styles};

		if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_ICON_CONFIG.show, ...this.config.show};

		this.config.entity_index = this.config.entity_index ? this.config.entity_index : 0;

// from original
		this.config.entity = this.config.entity ? this.config.entity : 0;
		
		// get icon size, and calculate the foreignObject position and size. This must match the icon size
		// 1em = FONT_SIZE pixels, so we can calculate the icon size, and x/y positions of the foreignObject
		// the viewport is 200x200, so we can calulate the offset.
		//
		// NOTE:
		// Safari doesn't use the svg viewport for rendering of the foreignObject, but the real clientsize.
		// So positioning an icon doesn't work correctly...
		
		this.dimensions.iconSize = this.config.icon_size ? this.config.icon_size : 2;
		this.dimensions.iconPixels = this.dimensions.iconSize * FONT_SIZE;
		const x = this.config.cx ? this.config.cx / 100 : 0.5;
		const y = this.config.cy ? this.config.cy / 100 : 0.5;
		
		const align = this.config.align ? this.config.align : 'center';
		const adjust = (align == 'center' ? 0.5 : (align == 'start' ? -1 : +1));

	//	const parentClientWidth = this.parentElement.clientWidth;
		const clientWidth = this._parent.clientWidth; // hard coded adjust for padding...
		const correction = clientWidth / this._parent.viewBox.width;

		// icon is not calculated against viewbox, but against toolset pos 
		//this.coords.xpx = (x * this._parent.viewBox.width);
		//this.coords.ypx = (y * this._parent.viewBox.height);

		this.coords.xpx = this.coords.cx;//(x * this._parent.viewBox.width);
		this.coords.ypx = this.coords.cy;//(y * this._parent.viewBox.height);

		
		if ((this._parent.isSafari) || (this._parent.iOS)) {
			this.dimensions.iconSize = this.dimensions.iconSize * correction;

			this.coords.xpx = (this.coords.xpx * correction) - (this.dimensions.iconPixels * adjust * correction);
			this.coords.ypx = (this.coords.ypx * correction) - (this.dimensions.iconPixels * 0.5 * correction) - (this.dimensions.iconPixels * 0.25 * correction);// - (iconPixels * 0.25 / 1.86);
		} else {
			// Get x,y in viewbox dimensions and center with half of size of icon.
			// Adjust horizontal for aligning. Can be 1, 0.5 and -1
			// Adjust vertical for half of height... and correct for 0.25em textfont to align.
			this.coords.xpx = this.coords.xpx - (this.dimensions.iconPixels * adjust);
			this.coords.ypx = this.coords.ypx - (this.dimensions.iconPixels * 0.5) - (this.dimensions.iconPixels * 0.25);
		}

		if (this.debug) console.log('EntityIconTool constructor coords, dimensions, config', this.coords, this.dimensions, this.config);
	}

 /*******************************************************************************
	* _renderIcon()
	*
	* Summary.
	*	Renders the icon using precalculated coordinates and dimensions.
	* Only the runtime style is calculated before rendering the icon
	*
	*/

  _renderIcon() {

		// Get configuration styles as the default styles
		let configStyle = {...this.config.styles};
		
		// Get the runtime styles, caused by states & animation settings
		let stateStyle = {};
		if (this._parent.animations.icons[this.config.animation_id])
			stateStyle = Object.assign(stateStyle, this._parent.animations.icons[this.config.animation_id]);

		// Merge the two, where the runtime styles may overwrite the statically configured styles
		configStyle = { ...configStyle, ...stateStyle};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

		const icon = this._parent._buildIcon(
			this._parent.entities[this.config.entity_index], this._parent.config.entities[this.config.entity_index]);

		if (true || (this.coords.xpx == 0)) {
			
			this.dimensions.iconSize = this.config.icon_size ? this.config.icon_size : 2;
			this.dimensions.iconPixels = this.dimensions.iconSize * FONT_SIZE;
			const x = this.config.cx ? this.config.cx / 100 : 0.5;
			const y = this.config.cy ? this.config.cy / 100 : 0.5;
			
			const align = this.config.align ? this.config.align : 'center';
			const adjust = (align == 'center' ? 0.5 : (align == 'start' ? -1 : +1));

		//	const parentClientWidth = this.parentElement.clientWidth;
			const clientWidth = this._parent.clientWidth; // hard coded adjust for padding...
			const correction = clientWidth / this._parent.viewBox.width;

			// icon is not calculated against viewbox, but against toolset pos 
			//this.coords.xpx = (x * this._parent.viewBox.width);
			//this.coords.ypx = (y * this._parent.viewBox.height);

			this.coords.xpx = this.coords.cx;//(x * this._parent.viewBox.width);
			this.coords.ypx = this.coords.cy;//(y * this._parent.viewBox.height);
			
			if ((this._parent.isSafari) || (this._parent.iOS)) {
				this.dimensions.iconSize = this.dimensions.iconSize * correction;

				this.coords.xpx = (this.coords.xpx * correction) - (this.dimensions.iconPixels * adjust * correction);
				this.coords.ypx = (this.coords.ypx * correction) - (this.dimensions.iconPixels * 0.9 * correction);
												//- (this.dimensions.iconPixels * 0.25 * correction);// - (iconPixels * 0.25 / 1.86);
			} else {
				// Get x,y in viewbox dimensions and center with half of size of icon.
				// Adjust horizontal for aligning. Can be 1, 0.5 and -1
				// Adjust vertical for half of height... and correct for 0.25em textfont to align.
				this.coords.xpx = this.coords.xpx - (this.dimensions.iconPixels * adjust);
				this.coords.ypx = this.coords.ypx - (this.dimensions.iconPixels * 0.9);
																					//+ (this.dimensions.iconPixels * 0.5);
			}
		}

//				<foreignObject width="${this.dimensions.iconPixels}" height="${this.dimensions.iconPixels}" x="${this.coords.xpx}" y="${this.coords.ypx}">

//						<div class="div__icon" xmlns="http://www.w3.org/1999/xhtml" width="100%" height="100% !important">
//								<ha-icon .icon=${icon} style="${configStyleStr}";></ha-icon>
//						</div>

		if ((this._parent.isSafari) || (this._parent.iOS)) {	
			return svg`
				<foreignObject width="${this.dimensions.iconSize}em" height="${this.dimensions.iconSize}em" x="${this.coords.xpx}" y="${this.coords.ypx}">
					<div class="div__icon" xmlns="http://www.w3.org/1999/xhtml"
								style="line-height:${this.dimensions.iconSize}em;">
								<ha-icon .icon=${icon} style="${configStyleStr}";></ha-icon>
					</div>
				</foreignObject>
				`;
		} else {				
			return svg`
				<foreignObject width="${this.dimensions.iconSize}em" height="${this.dimensions.iconSize}em" x="${this.coords.xpx}" y="${this.coords.ypx}">
					<div class="div__icon" xmlns="http://www.w3.org/1999/xhtml"
								style="line-height:${this.dimensions.iconSize}em;">
						<ha-icon .icon=${icon} style="${configStyleStr}"></ha-icon>
					</div>
				</foreignObject>
				`;		
		}
/*
		return svg`
		<g @click=${e => this.handlePopup(e, this._parent.entities[this.config.entity_index])}>
			<foreignObject width="${this.dimensions.iconSize}em" height="${this.dimensions.iconSize}em" x="${this.coords.xpx}" y="${this.coords.ypx}">
				<body>
					<div class="icon">
						<ha-icon .icon=${icon} style="${configStyleStr}";></ha-icon>
					</div>
				</body>
			</foreignObject>
			<g>
			`;		
*/
	}	

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	* NTS:
	* Adding 				<style> div { overflow: hidden;}</style>
	* to the <g group, clips the icon against the ha-card, ie the div.
	* however, on Safari, all icons are clipped, as if they don't fit the room given to be displayed.
	* a bug in rendering the Icon?? Only first time icon is clipped, then displayed normally if a data update
	* from hass is coming in.
	*/
	render() {

		// this.viewbox contains the size of the viewbox.
		// svg translate uses hard values relative to the viewbox, not percentages
		// We have to recalculate x and y given viewbox dimensions and scale percentage
		// .5 scale is 50x and 100y on 2/1 grid for example
		// .5 * 200 = 100. and then 200/400 = 0.5. Thus 0.5 * 100 = 50
		// .5 * 200 = 100. and then 200/200 = 1. Thus 1 * 100 = 100
		//
		// Working calculation:
		// coords = 50, 90
		// scalex = 50 * scale
		// diffx = 50 - scalex
		// xlatex = diffx / scale 
		//
		// same for xlatey!
		//
		// #TODO:
		// Rendering icon for Safari should take scale in account. Currently size is in pixels, so the
		// original is shown.
		// And for chrome: the shift in pixels should also be scaled. Not done yet. Icon is displayd lower
		// then should be, ie not centered...
		
/*
		let scalex = this.coords.cx * this.toolsetPos.scale;
		let scaley = this.coords.cy * this.toolsetPos.scale;
		let diffx = this.coords.cx - scalex;
		let diffy = this.coords.cy - scaley;
		let xlatex = diffx / this.toolsetPos.scale;
		let xlatey = diffy / this.toolsetPos.scale;
		let scale = this.toolsetPos.scale;
		if (this.debug) console.log('renderIcon - xlatex/y values', scale, this.toolsetPos.scale, xlatex, xlatey, this.coords, this.dimensions);
*/		
    return svg`
			<g filter="url(#ds)" id="icon-${this.toolId}" class="svgicon" transform="scale(${this.toolsetPos.scale}) translate(${this.dimensions.xlateX} ${this.dimensions.xlateY})"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >

				${this._renderIcon()}
			</g>
		`;

	}	
} // END of class

 /*******************************************************************************
	* BadgeTool class
	*
	* Summary.
	*
	*/

class BadgeTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_BADGE_CONFIG = {
			ratio: 30,
			divider: 30,
			styles: {
				left: {
					"stroke-width": '0;',
					"fill": 'grey;',
				},
				right: {
					"stroke-width": '0;',
					"fill": 'var(--theme-gradient-color-03);',
				}
			}
		}
		super(argParent, argConfig, argPos);
		
		this.config = {...DEFAULT_BADGE_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_BADGE_CONFIG.styles, ...this.config.styles};

		if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_BADGE_CONFIG.show, ...this.config.show};
		
//		this._badge = {};
		
		// Coordinates from left and right part.
		this.svg.radius = 5;
		this.svg.leftXpos = this.svg.x;
		this.svg.leftYpos = this.svg.y;
		this.svg.leftWidth = (this.config.ratio / 100) * this.dimensions.width;
		this.svg.arrowSize = (this.dimensions.height * this.config.divider / 100) / 2;
		this.svg.divSize = (this.dimensions.height * (100 - this.config.divider) / 100) / 2;

		this.svg.rightXpos = this.svg.x + this.svg.leftWidth;
		this.svg.rightYpos = this.svg.y;
		this.svg.rightWidth = ((100 - this.config.ratio) / 100) * this.dimensions.width;

		if (this.debug) console.log('BadgeTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

 /*******************************************************************************
	* _renderBadge()
	*
	* Summary.
	*	Renders the badge using precalculated coordinates and dimensions.
	* Only the runtime style is calculated before rendering the badge
	*
	* Refs for creating the path online:
	*	-	https://mavo.io/demos/svgpath/
	*
	*/

  _renderBadge() {

		var svgItems = [];
		
		// Get configuration styles as the default styles
		let configStyleLeft = this.config.styles.left ? {...this.config.styles.left} : '';
		let configStyleRight = this.config.styles.right ? {...this.config.styles.right} : '';
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleLeftStr = JSON.stringify(configStyleLeft).slice(1, -1).replace(/"/g,"").replace(/,/g,"");
		const configStyleRightStr = JSON.stringify(configStyleRight).slice(1, -1).replace(/"/g,"").replace(/,/g,"");
		
		svgItems = svg`
			<g  id="badge-${this.toolId}">
				<path filter="url(#ds)" d="
						M ${this.svg.rightXpos} ${this.svg.rightYpos}
						h ${this.svg.rightWidth - this.svg.radius}
						a ${this.svg.radius} ${this.svg.radius} 0 0 1 ${this.svg.radius} ${this.svg.radius}
						v ${this.dimensions.height - 2 * this.svg.radius}
						a ${this.svg.radius} ${this.svg.radius} 0 0 1 -${this.svg.radius} ${this.svg.radius}
						h -${this.svg.rightWidth - this.svg.radius}
						v -${this.dimensions.height - 2 * this.svg.radius}
						z
						"
						style="${configStyleRightStr}"/>

				<path filter="url(#ds)" d="
						M ${this.svg.leftXpos + this.svg.radius} ${this.svg.leftYpos}
						h ${this.svg.leftWidth - this.svg.radius}
						v ${this.svg.divSize}
						l ${this.svg.arrowSize} ${this.svg.arrowSize}
						l -${this.svg.arrowSize} ${this.svg.arrowSize}
						l 0 ${this.svg.divSize}
						h -${this.svg.leftWidth - this.svg.radius}
						a -${this.svg.radius} -${this.svg.radius} 0 0 1 -${this.svg.radius} -${this.svg.radius}
						v -${this.dimensions.height - 2 * this.svg.radius}
						a ${this.svg.radius} ${this.svg.radius} 0 0 1 ${this.svg.radius} -${this.svg.radius}
						"
						style="${configStyleLeftStr}"/>
			</g>
			`;
		
		return svg`${svgItems}`;
	}	

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	*/
	render() {

    return svg`
			<g id="badge-${this.toolId}" class="badge"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderBadge()}
			</g>
		`;

	}	
} // END of class

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

 /*******************************************************************************
	* EntityStateTool class
	*
	* Summary.
	*
	*/

class EntityStateTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		const DEFAULT_STATE_CONFIG = {
		}
		super(argParent, argConfig, argPos);
		
		this.config = {...DEFAULT_STATE_CONFIG};
		this.config = {...this.config, ...argConfig};

		this._value = 0;
		this._valuePrev = 0;
		this._valueIsDirty = false;
		
		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_STATE_CONFIG.styles, ...this.config.styles};

		if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_STATE_CONFIG.show, ...this.config.show};
		
		if (this.debug) console.log('EntityStateTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

	set value(state) {
		if (this._value == state) return false;
		
		this._valuePrev = this._value || state;
		this._value = state;
		this._valueIsDirty = true;
		return true;
	}
	
	render() {

		// compute x,y or dx,dy positions. Spec none if not specified.
		//const x = item.cx ? item.cx : '';
		//const y = item.cy ? item.cy : '';
		//const dx = item.dx ? item.dx : '0';
		//const dy = item.dy ? item.dy : '0';
		const dx = '0';
		const dy = '0';

		// compute some styling elements if configured for this state item
		const STATE_STYLES = {
			"font-size": '1em;',
			"color": 'var(--primary-text-color);',
			"opacity": '1.0;',
			"text-anchor": 'middle;'
		};

		const UOM_STYLES = {
			"opacity": '0.7;'
		};

		// Get configuration styles as the default styles
		let configStyle = {...STATE_STYLES};
	//  if (item.styles) configStyle = Object.assign(configStyle, ...item.styles);
		if (this.config.styles) configStyle = {...configStyle, ...this.config.styles};
		
		// Get the runtime styles, caused by states & animation settings
		let stateStyle = {};
		if (this._parent.animations.states[this.config.index])
			stateStyle = Object.assign(stateStyle, this._parent.animations.states[this.config.index]);

		// Merge the two, where the runtime styles may overwrite the statically configured styles
		configStyle = { ...configStyle, ...stateStyle};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

		// Get font-size of state in configStyle.
		// Split value and px/em; See: https://stackoverflow.com/questions/3370263/separate-integers-and-text-in-a-string
		// For floats and strings:
		//  - https://stackoverflow.com/questions/17374893/how-to-extract-floating-numbers-from-strings-in-javascript
		
		// 2019.09.12
		// https://stackoverflow.com/questions/40758143/regular-expression-to-split-double-and-integer-numbers-in-a-string
		// https://regex101.com/r/QYfDtB/1
		// regex \D+|\d*\.?\d+ (plus /g for global match)
		// in twee stukken, dus 1.27 en em;
		
		var fsuomStr = configStyle["font-size"];

		var fsuomValue = 0.5;
		var fsuomType = 'em;'
		const fsuomSplit = fsuomStr.match(/\D+|\d*\.?\d+/g);
		if (fsuomSplit.length == 2) {
			fsuomValue = Number(fsuomSplit[0]) * .6;
			fsuomType = fsuomSplit[1];
		}
		else console.error('Cannot determine font-size for state', fsuomStr);

		fsuomStr = { "font-size": fsuomValue + fsuomType};
		
		let uomStyle = {...configStyle, ...UOM_STYLES, ...fsuomStr};
		const uomStyleStr = JSON.stringify(uomStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");
		
		const uom = this._parent._buildUom(this._parent.entities[this.config.entity_index], this._parent.config.entities[this.config.entity_index]);

		const state = (this._parent.config.entities[this.config.entity_index].attribute &&
									this._parent.entities[this.config.entity_index].attributes[this._parent.config.entities[this.config.entity_index].attribute])
									? this._parent.attributesStr[this.config.entity_index]
									: this._parent.entitiesStr[this.config.entity_index];
		
		if (this._parent._computeDomain(this._parent.entities[this.config.entity_index].entity_id) == 'sensor') {
			return svg`
				<text @click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])}>
					<tspan class="state__value" x="${this.svg.x}" y="${this.svg.y}" dx="${dx}em" dy="${dy}em" 
						style="${configStyleStr}">
						${state}</tspan>
					<tspan class="state__uom" dx="-0.1em" dy="-0.45em"
						style="${uomStyleStr}">
						${uom}</tspan>
				</text>
			`;
		} else {
			// Not a sensor. Might be any other domain. Unit can only be specified using the units: in the configuration.
			// Still check for using an attribute value for the domain...
			return svg`
				<text @click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])}>
					<tspan class="state__value" x="${this.svg.x}" y="${this.svg.y}" dx="${dx}em" dy="${dy}em" 
						style="${configStyleStr}">
						${state}</tspan>
					<tspan class="state__uom" dx="-0.1em" dy="-0.45em"
						style="${uomStyleStr}">
						${uom}</tspan>
				</text>
			`;
		}
	}
}
 /*******************************************************************************
	* EntityNameTool class
	*
	* Summary.
	*
	* #TODO
	* Migrate to BaseTool class. Not yet done. issue #2
	*/

class EntityNameTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_NAME_CONFIG = {
		}
		
		super(argParent, argConfig, argPos);

		this.config = {...DEFAULT_NAME_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_NAME_CONFIG.styles, ...this.config.styles};

		this._name = {};
		
		// Text is rendered in its own context. No need for SVG coordinates.

		if (this.debug) console.log('EntityName constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

 /*******************************************************************************
	* _renderEntityName()
	*
	* Summary.
	*	Renders the entity name using precalculated coordinates and dimensions.
	* Only the runtime style is calculated before rendering the name
	*
	*/

  _renderEntityName() {

		// compute some styling elements if configured for this name item
		const ENTITY_NAME_STYLES = {
			"font-size": '1.5em;',
			"fill": 'var(--primary-text-color);',
			"opacity": '1.0;',
			"text-anchor": 'middle;'
		};

		// Get configuration styles as the default styles
		let configStyle = {...ENTITY_NAME_STYLES};
		//if (item.styles) configStyle = Object.assign(configStyle, ...item.styles);
		if (this.config.styles) configStyle = {...configStyle, ...this.config.styles};
		
		// Get the runtime styles, caused by states & animation settings
		let stateStyle = {};
		if (this._parent.animations.names[this.config.index])
			stateStyle = Object.assign(stateStyle, this._parent.animations.names[this.config.index]);

		// Merge the two, where the runtime styles may overwrite the statically configured styles
		configStyle = { ...configStyle, ...stateStyle};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

		const name = this._parent._buildName(this._parent.entities[this.config.entity_index], this._parent.config.entities[this.config.entity_index]);

		return svg`
				<text>
					<tspan class="entity__name" x="${this.coords.cx}" y="${this.coords.cy}" style="${configStyleStr}">${name}</tspan>
				</text>
			`;
	}	

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	*/
	render() {

    return svg`
			<g id="name-${this.toolId}" class="name"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderEntityName()}
			</g>
		`;

	}	
} // END of class


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

 /*******************************************************************************
	* EntityAreaTool class
	*
	* Summary.
	*
	* #TODO
	* - Convert to class using baseclass. Not yet done !!!!!!!!!!!!!!!!
	*/

class EntityAreaTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_AREA_CONFIG = {
		}

		super(argParent, argConfig, argPos);
		
		this.config = {...DEFAULT_AREA_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_AREA_CONFIG.styles, ...this.config.styles};

		//this._name = {};
		
		// Text is rendered in its own context. No need for SVG coordinates.

		if (this.debug) console.log('EntityAreaTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

 /*******************************************************************************
	* _renderEntityArea()
	*
	* Summary.
	*	Renders the entity area using precalculated coordinates and dimensions.
	* Only the runtime style is calculated before rendering the area
	*
	*/

  _renderEntityArea() {

		// compute some styling elements if configured for this area item
		const ENTITY_AREA_STYLES = {
			"font-size": '1em;',
			"fill": 'var(--primary-text-color);',
			"opacity": '1.0;',
			"text-anchor": 'middle;'
		};

		// Get configuration styles as the default styles
		let configStyle = {...ENTITY_AREA_STYLES};
		//if (item.styles) configStyle = Object.assign(configStyle, ...item.styles);
		if (this.config.styles) configStyle = {...configStyle, ...this.config.styles};
		
		// Get the runtime styles, caused by states & animation settings
		let stateStyle = {};
		if (this._parent.animations.areas[this.config.index])
			stateStyle = Object.assign(stateStyle, this._parent.animations.areas[this.config.index]);

		// Merge the two, where the runtime styles may overwrite the statically configured styles
		configStyle = { ...configStyle, ...stateStyle};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

		const area = this._parent._buildArea(this._parent.entities[this.config.entity_index], this._parent.config.entities[this.config.entity_index]);

		return svg`
				<text class="entity__area">
					<tspan class="entity__area" x="${this.coords.cx}" y="${this.coords.cy}" style="${configStyleStr}">${area}</tspan>
				</text>
			`;
	}	

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	*/
	render() {

    return svg`
			<g id="area-${this.toolId}" class="area"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderEntityArea()}
			</g>
		`;

	}	
} // END of class

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

 /*******************************************************************************
	* HorseshoeTool class
	*
	* Summary.
	*
	*/

class HorseshoeTool extends BaseTool {
		// Donut starts at -220 degrees and is 260 degrees in size.
		// zero degrees is at 3 o'clock.


	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_HORSESHOE_CONFIG = {
			cx: 50,
			cy: 50,
			radius: 45,
			card_filter: 'card--filter-none',
			horseshoe_scale: {	min: 0,
									max: 100,
									width: 3,
									color: 'var(--primary-background-color)'},
			horseshoe_state: {	width: 6,
									color: 'var(--primary-color)'},
			show: {horseshoe: true,
						 scale_tickmarks: false,
						 horseshoe_style: 'fixed'}
		}


		super(argParent, argConfig, argPos);

		// Next consts are now variable. Should be calculated!!!!!!
		this.HORSESHOE_RADIUS_SIZE = 0.45 * SVG_VIEW_BOX;
		this.TICKMARKS_RADIUS_SIZE = 0.43 * SVG_VIEW_BOX;
		this.HORSESHOE_PATH_LENGTH = 2 * 260/360 * Math.PI * this.HORSESHOE_RADIUS_SIZE;
		
		this.config = {...DEFAULT_HORSESHOE_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_HORSESHOE_CONFIG.styles, ...this.config.styles};

		//if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_HORSESHOE_CONFIG.show, ...this.config.show};

		//if (argConfig.horseshoe_scale) this.config.horseshoe_scale = Object.assign(...argConfig.horseshoe_scale);
		this.config.horseshoe_scale = {...DEFAULT_HORSESHOE_CONFIG.horseshoe_scale, ...this.config.horseshoe_scale};

		if (argConfig.horseshoe_state) this.config.horseshoe_state = Object.assign(...argConfig.horseshoe_state);
		this.config.horseshoe_state = {...DEFAULT_HORSESHOE_CONFIG.horseshoe_state, ...this.config.horseshoe_state};

		this.config.entity_index = this.config.entity_index ? this.config.entity_index : 0;
		
		this.dimensions.radius = Utils.calculateDimension(this.config.radius)
		this.dimensions.radius_ticks = Utils.calculateDimension(0.95 * this.config.radius)

		this.dimensions.horseshoe_scale = {};
		this.dimensions.horseshoe_scale.width = Utils.calculateDimension(this.config.horseshoe_scale.width);
		this.dimensions.horseshoe_state = {};
		this.dimensions.horseshoe_state.width = Utils.calculateDimension(this.config.horseshoe_state.width);
		this.dimensions.horseshoe_scale.dasharray = 2 * 26/36 * Math.PI * this.dimensions.radius;
		
		// The horseshoe is rotated around its svg base point. This is NOT the center of the circle!
		// Adjust x and y positions within the svg viewport to re-center the circle after rotating
		this.svg.rotate = {};
		this.svg.rotate.degrees = -220;
		this.svg.rotate.shiftX = this.coords.cx;
		this.svg.rotate.shiftY = this.coords.cy;
		
    // Get colorstops and make a key/value store...
		this.colorStops = {};
    if (this.config.color_stops) {
      Object.keys(this.config.color_stops).forEach((key) => {
        this.colorStops[key] = this.config.color_stops[key];
      });
    }

		this.sortedStops = Object.keys(this.colorStops).map(n => Number(n)).sort((a, b) => a - b);

		// Create a colorStopsMinMax list for autominmax color determination
		this.colorStopsMinMax = {};
		this.colorStopsMinMax[this.config.horseshoe_scale.min] = this.colorStops[this.sortedStops[0]];
		this.colorStopsMinMax[this.config.horseshoe_scale.max] = this.colorStops[this.sortedStops[(this.sortedStops.length)-1]];

		// Now set the color0 and color1 for the gradient used in the horseshoe to the colors
		// Use default for now!!
		this.color0 = this.colorStops[this.sortedStops[0]];
		this.color1 = this.colorStops[this.sortedStops[(this.sortedStops.length)-1]];
		
		this.angleCoords = {'x1' : '0%', 'y1' : '0%', 'x2': '100%', 'y2' : '0%'};
		//this.angleCoords = angleCoords;
		this.color1_offset = '0%';

		//====================
		// End setConfig part.

		if (this.debug) console.log('HorseshoeTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}

 /*******************************************************************************
	* HorseshoeTool.
	*	- set value()
	*
	* Summary.
	*	Sets the value of the horseshoe. Value updated via set hass().
	*	Calculate horseshoe settings & colors depening on config and new value.
	*
	*/

	set value(state) {
		if (this._value == state) return false;
		
		this._valuePrev = this._value || state;
		this._value = state;
		this._valueIsDirty = true;

		// Calculate the size of the arc to fill the dasharray with this 
		// value. It will fill the horseshoe relative to the state and min/max
		// values given in the configuration.
		
    const min = this.config.horseshoe_scale.min || 0;
    const max = this.config.horseshoe_scale.max || 100;
    const val = Math.min(this._parent._calculateValueBetween(min, max, state), 1);
    const score = val * this.HORSESHOE_PATH_LENGTH;
    const total = 10 * this.HORSESHOE_RADIUS_SIZE;
    this.dashArray = `${score} ${total}`;

		// We must draw the horseshoe. Depending on the stroke settings, we draw a fixed color, gradient, autominmax or colorstop 
		// #TODO: only if state or attribute has changed.

		const strokeStyle = this.config.show.horseshoe_style;
	
		if (strokeStyle == 'fixed') {
			this.stroke_color = this.config.horseshoe_state.color;
			this.color0 = this.config.horseshoe_state.color;
			this.color1 = this.config.horseshoe_state.color;
			this.color1_offset = '0%';
			//	We could set the circle attributes, but we do it with a variable as we are using a gradient
			//	to display the horseshoe circle	.. <horseshoe circle>.setAttribute('stroke', stroke);
		}
		else if (strokeStyle == 'autominmax') {
			// Use color0 and color1 for autoranging the color of the horseshoe
			const stroke = this._parent._calculateColor(state, this.colorStopsMinMax, true);

			// We now use a gradient for the horseshoe, using two colors
			// Set these colors to the colorstop color...
			this.color0 = stroke;
			this.color1 = stroke;
			this.color1_offset = '0%';
		}
		else if (strokeStyle == 'colorstop' || strokeStyle == 'colorstopgradient') {
			const stroke = this._parent._calculateColor(state, this.colorStops, strokeStyle === 'colorstopgradient');

			// We now use a gradient for the horseshoe, using two colors
			// Set these colors to the colorstop color...
			this.color0 = stroke;
			this.color1 = stroke;
			this.color1_offset = '0%';
		}
		else if (strokeStyle == 'lineargradient') {
			// This has taken a lot of time to get a satisfying result, and it appeared much simpler than anticipated.
			// I don't understand it, but for a circle, a gradient from left/right with adjusted stop is enough ?!?!?!
			// No calculations to adjust the angle of the gradient, or rotating the gradient itself.
			// Weird, but it works. Not a 100% match, but it is good enough for now...

			// According to stackoverflow, these calculations / adjustments would be needed, but it isn't ;-)
			// Added from https://stackoverflow.com/questions/9025678/how-to-get-a-rotated-linear-gradient-svg-for-use-as-a-background-image
			const angleCoords = {'x1' : '0%', 'y1' : '0%', 'x2': '100%', 'y2' : '0%'};
			this.color1_offset = `${Math.round((1-val)*100)}%`;

			this.angleCoords = angleCoords;
		}
		if (this.debug) console.log('HorseshoeTool set value', this.cardId, state);

		return true;
	}

/*******************************************************************************
	* renderTickMarks()
	*
	* Summary.
	* Renders the tick marks on the scale.
	*
	*/

  _renderTickMarks() {
		const { config, } = this;
		//if (!config) return;
		//if (!config.show) return;
		if (!config.show.scale_tickmarks) return;
		
		const stroke = config.horseshoe_scale.color ? config.horseshoe_scale.color : 'var(--primary-background-color)';
		const tickSize = config.horseshoe_scale.ticksize ? config.horseshoe_scale.ticksize
										: (config.horseshoe_scale.max - config.horseshoe_scale.min) / 10;
		
		// fullScale is 260 degrees. Hard coded for now...
		const fullScale = 260;
		const remainder = config.horseshoe_scale.min % tickSize;
		const startTickValue = config.horseshoe_scale.min + (remainder == 0 ? 0 : (tickSize - remainder));
		const startAngle = ((startTickValue - config.horseshoe_scale.min) /
												(config.horseshoe_scale.max - config.horseshoe_scale.min)) * fullScale;
		var tickSteps = ((config.horseshoe_scale.max - startTickValue) / tickSize);
		
		// new
		var steps = Math.floor(tickSteps);
		const angleStepSize = (fullScale - startAngle) / tickSteps;
		
		// If steps exactly match the max. value/range, add extra step for that max value.
		if ((Math.floor(((steps) * tickSize) + startTickValue)) <= (config.horseshoe_scale.max)) {steps++;}
		
		const radius = this.dimensions.horseshoe_scale.width ? this.dimensions.horseshoe_scale.width / 2 : 6/2;
		var angle;
		var scaleItems = [];

    // NTS:
    // Value of -230 is weird. Should be -220. Can't find why...
		var i;
		for (i = 0; i < steps; i++) {
			angle = startAngle + ((-230 + (360 - i*angleStepSize)) * Math.PI / 180);
			scaleItems[i] = svg`
				<circle cx="${this.coords.cx - Math.sin(angle)*this.dimensions.radius_ticks}"
								cy="${this.coords.cy - Math.cos(angle)*this.dimensions.radius_ticks}" r="${radius}"
								fill="${stroke}">
			`;
/*
				<circle cx="${50 + 50 - Math.sin(angle)*this.TICKMARKS_RADIUS_SIZE}"
								cy="${50 + 50 - Math.cos(angle)*this.TICKMARKS_RADIUS_SIZE}" r="${radius}"
								fill="${stroke}">
			`;
*/
		}
		return svg`${scaleItems}`;
	}

/*******************************************************************************
	* _renderHorseShoe()
	*
	* Summary.
	* Renders the horseshoe group.
	*
	* Description.
	* The horseshoes are rendered in a viewbox of 200x200 (SVG_VIEW_BOX).
	* Both are centered with a radius of 45%, ie 200*0.45 = 90.
	*
	* The foreground horseshoe is always rendered as a gradient with two colors.
	*
	* The horseshoes are rotated 220 degrees and are 2 * 26/36 * Math.PI * r in size 
	* There you get your value of 408.4070449,180 ;-)
	*/

  _renderHorseShoe() {

	if (!this.config.show.horseshoe) return;

	return svg`
			<g id="horseshoe__svg__group" class="horseshoe__svg__group">
				<circle id="horseshoe__scale" class="horseshoe__scale" cx="${this.coords.cx}" cy="${this.coords.cy}" r="${this.dimensions.radius}"
					fill="${this.fill || 'rgba(0, 0, 0, 0)'}"
					stroke="${this.config.horseshoe_scale.color || '#000000'}"
					stroke-dasharray="${this.dimensions.horseshoe_scale.dasharray}"
					stroke-width="${this.dimensions.horseshoe_scale.width}" 
					stroke-linecap="square"
					transform="rotate(-220 ${this.svg.rotate.shiftX} ${this.svg.rotate.shiftY})"/>

				<circle id="horseshoe__state__value" class="horseshoe__state__value" cx="${this.coords.cx}" cy="${this.coords.cy}" r="${this.dimensions.radius}"
					fill="${this.config.fill || 'rgba(0, 0, 0, 0)'}"
					stroke="url('#horseshoe__gradient-${this.cardId}')"
					stroke-dasharray="${this.dashArray}"
					stroke-width="${this.dimensions.horseshoe_state.width}" 
					stroke-linecap="square"
					transform="rotate(-220 ${this.svg.rotate.shiftX} ${this.svg.rotate.shiftY})"/>
				
				${this._renderTickMarks()}
			</g>
		`;

/*
	
	return svg`
			<g id="horseshoe__svg__group" class="horseshoe__svg__group">
				<circle id="horseshoe__scale" class="horseshoe__scale" cx="50%" cy="50%" r="45%"
					fill="${this.fill || 'rgba(0, 0, 0, 0)'}"
					stroke="${this.config.horseshoe_scale.color || '#000000'}"
					stroke-dasharray="408.4070449,180"
					stroke-width="${this.config.horseshoe_scale.width || 6}" 
					stroke-linecap="square"
					transform="rotate(-220 100 100)"/>

				<circle id="horseshoe__state__value" class="horseshoe__state__value" cx="50%" cy="50%" r="45%"
					fill="${this.config.fill || 'rgba(0, 0, 0, 0)'}"
					stroke="url('#horseshoe__gradient-${this.cardId}')"
					stroke-dasharray="${this.dashArray}"
					stroke-width="${this.config.horseshoe_state.width || 12}" 
					stroke-linecap="square"
					transform="rotate(-220 100 100)"/>
				
				${this._renderTickMarks()}
			</g>
		`;
*/
  }
 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The render() function for this object.
	*
	*/
	render() {

    return svg`
			<g filter="url(#ds)" id="circle-${this.toolId}" class="circle"
				@click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderHorseShoe()}
			</g>

			<svg style="width:0;height:0;position:absolute;" aria-hidden="true" focusable="false">
				<linearGradient gradientTransform="rotate(0)" id="horseshoe__gradient-${this.cardId}" x1="${this.angleCoords.x1}", y1="${this.angleCoords.y1}", x2="${this.angleCoords.x2}" y2="${this.angleCoords.y2}">
					<stop offset="${this.color1_offset}" stop-color="${this.color1}" />
					<stop offset="100%" stop-color="${this.color0}" />
				</linearGradient>
			</svg>
			
		`;

	}	
} // END of class

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

class SparkleBarChartTool extends BaseTool {
	constructor (argParent, argConfig, argPos) {
		
		const DEFAULT_BARCHART_CONFIG = {
			cx: 50,
			cy: 50,
			height: 25,
			width: 25,
			margin: 0.5,
			hours: 24,
			barhours: 1,
			type: 'vertical',
			color: 'var(--primary-color)',
			styles: { "stroke": 'var(--primary-color);',
								"stroke-linecap": 'round;',
								"stroke-linejoin": 'round;',
			},
			colorstops: [],
			show: {style: 'fixedcolor'}
		}	

		super(argParent, argConfig, argPos);

		this.config = {...DEFAULT_BARCHART_CONFIG};
		this.config = {...this.config, ...argConfig};

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_BARCHART_CONFIG.styles, ...this.config.styles};

		if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_BARCHART_CONFIG.show, ...this.config.show};
		
		// Calculate real dimensions...
		this.dimensions.margin = Utils.calculateDimension(this.config.margin);
		// #TODO: Nog check op style? voor hor anders dan vert???
		const theWidth = (this.config.type == 'vertical') ?  this.dimensions.width : this.dimensions.height;

		this.dimensions.barWidth = (theWidth - (((this.config.hours / this.config.barhours) - 1) *
																this.dimensions.margin)) / (this.config.hours / this.config.barhours);
		this._data = []; //new Array(this.hours).fill(0);
		this._bars = []; //new Array(this.hours).fill({});
		this._scale = {};
		this._needsRendering = false;

		if (this.debug) console.log('SparkleBarChart constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
	}
	
 /*******************************************************************************
	* computeMinMax()
	*
	* Summary.
	*	Compute min/max values of bars to scale them to the maximum amount.
	*
	*/
	computeMinMax() {
		let min = this._series[0], max = this._series[0];

		for (let i = 1, len=this._series.length; i < len; i++) {
			let v = this._series[i];
			min = (v < min) ? v : min;
			max = (v > max) ? v : max;
		}
		this._scale.min = min;
		this._scale.max = max;
		this._scale.size = (max - min);
	}	

 /*******************************************************************************
	* set series
	*
	* Summary.
	*	Sets the timeseries for the barchart tool. Is an array of states.
	*	If this is historical data, the caller has taken the time to create this.
	* This tool only displays the result...
	*
	*/
	set data(states) {
		this._series = Object.assign(states);
		this.computeBars();
		this._needsRendering = true;
	}	

	set series(states) {
		this._series = Object.assign(states);
		this.computeBars();
		this._needsRendering = true;
	}	
	
	hasSeries() {
		return this.config.entity_index;
	}

 /*******************************************************************************
	* computeBars()
	*
	* Summary.
	*	Compute start and end of bars for easy rendering.
	*
	*/
	computeBars({ _bars } = this) {

		this.computeMinMax();

		// VERTICAL
		if (this.config.type == 'vertical') {
			if (this.debug) console.log('bar is vertical');
			this._series.forEach((item, index) => {
				if (!_bars[index]) _bars[index] = {};
				_bars[index].length = ((item - this._scale.min) / (this._scale.size)) * this.dimensions.height;
				_bars[index].x1 = this.svg.x + ((this.dimensions.barWidth + this.dimensions.margin) * index);
				_bars[index].x2 = _bars[index].x1;
				_bars[index].y1 = this.svg.y + this.dimensions.height;
				_bars[index].y2 = _bars[index].y1 - this._bars[index].length;
			});
			// HORIZONTAL
		} else if (this.config.type == 'horizontal') {
			if (this.debug) console.log('bar is horizontal');
			this._data.forEach((item, index) => {
				if (!_bars[index]) _bars[index] = {};
				_bars[index].length = ((item - this._scale.min) / (this._scale.size)) * this.dimensions.width;
				_bars[index].y1 = this.svg.y + ((this.dimensions.barWidth + this.dimensions.margin) * index);
				_bars[index].y2 = _bars[index].y1;
				_bars[index].x1 = this.svg.x;
				_bars[index].x2 = _bars[index].x1 + this._bars[index].length;
			});
		} else {
			if (this.debug) console.log("SparkleBarChartTool - unknown barchart type (horizontal or vertical)");
		}
	}

 /*******************************************************************************
	* _renderBars()
	*
	* Summary.
	*	Render all the bars. Number of bars depend on hours and barhours settings.
	*
	*/
	_renderBars({ _bars } = this) {

		var svgItems = [];
		
		if (this._bars.length == 0) return;
		
		if (this.debug) console.log('_renderBars IN', this.toolId);
		// Get configuration styles as the default styles
		// Styles are already converted to an Object {}...
		let configStyle = {...this.config.styles};
		
		// Convert javascript records to plain text, without "{}" and "," between the styles.
		const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

		this._bars.forEach((item, index) => {
			if (this.debug) console.log('_renderBars - bars', item, index);
			svgItems.push(svg`
				<line id="line-segment-${this.toolId}-${index}" class="line__segment"
									style="${configStyleStr}"
									x1="${this._bars[index].x1}"
									x2="${this._bars[index].x2}"
									y1="${this._bars[index].y1}"
									y2="${this._bars[index].y2}"
									stroke-width="${this.dimensions.barWidth}"
									/>
				`);
		});
		if (this.debug) console.log('_renderBars OUT', this.toolId);
		
		return svg`${svgItems}`;
	}

 /*******************************************************************************
	* render()
	*
	* Summary.
	*	The actual render() function called by the card for each tool.
	*
	*/
	render() {
		
		//if (!this._needsRendering) return;

    return svg`
			<g filter="url(#ds)" id="barchart-${this.toolId}" class="barchart"
				 @click=${e => this._parent.handlePopup(e, this._parent.entities[this.config.entity_index])} >
				${this._renderBars()}
			</g>
		`;

	}
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

 /*******************************************************************************
	* SegmentedArcTool class
	*
	* Summary.
	*
	*/

class SegmentedArcTool extends BaseTool {
	constructor(argParent, argConfig, argPos) {
		
		const DEFAULT_SEGARC_CONFIG = {
			cx: 50,
			cy: 50,
			radius: 45,
			width: 6,
			margin: 1.5,
			color: 'var(--primary-color)',
			styles: { "stroke-linecap": 'round;',
								"fill": 'var(--primary-color);',
								"stroke": 'none;',
								"stroke-width": '0.5;',
								"fill-rule": 'evenodd;',
								"stroke-linejoin": 'round;'
			},
			styles_bg: { 
								"stroke-linecap": 'round;',
								"fill": 'var(--primary-background-color);',
								"stroke-width": '0;',
								"fill-rule": 'evenodd;',
								"stroke-linejoin": 'round;'
			},
			segments: {"dash": 10, "gap":1 },
			colorstops: [],
			scale: {"min": 0, "max": 100 },
			show: {	"style": 'fixedcolor',
							"scale_offset": 0,
							"scale": false,
						},
			scale_offset: -9,
			isScale: false,
			animation: {"duration": 1.5 },
		}	

		super(argParent, argConfig, argPos);
		this.config = {...DEFAULT_SEGARC_CONFIG};
		this.config = {...this.config, ...argConfig};

		// Check for gap. Big enough?
		if (this.config.segments.gap > 0) {
			const minGap = this.config.radius * Math.PI / SVG_VIEW_BOX / 2;
			this.config.segments.gap = Math.max(minGap, this.config.segments.gap);
		}

		if (argConfig.styles) this.config.styles = {...argConfig.styles};
		this.config.styles = {...DEFAULT_SEGARC_CONFIG.styles, ...this.config.styles};
		this.config.styles_bg = {...DEFAULT_SEGARC_CONFIG.styles_bg, ...this.config.styles_bg};

		// #TODO
		// Next line generates an error: Found non-callable @@interator
		//if (argConfig.show) this.config.show = Object.assign(...argConfig.show);
		this.config.show = {...DEFAULT_SEGARC_CONFIG.show, ...this.config.show};

		this.config.entity_index = this.config.entity_index ? this.config.entity_index : 0;
		
		this.dimensions.radius = Utils.calculateDimension(argConfig.radius);
		this.dimensions.segments = {};
		this.dimensions.segments.gap = Utils.calculateDimension(this.config.segments.gap);
		//this.dimensions.segments.dash = Utils.calculateDimension(this.config.segments.dash);
		this.dimensions.scale_offset = Utils.calculateDimension(this.config.scale_offset);
		
		// Added for confusion???????
		this._firstUpdatedCalled = false;

		// Remember the values to be able to render from/to
		this._value = null;
		this._valuePrev = null;
		this._valueIsDirty = false;
		this._renderFrom = null;
		this._renderTo = null;

		this.rAFid = null;
		this.cancelAnimation = false;
		
		this.arcId = null;

		// Cache path (d= value) of segments drawn in map by segment index (counter). Simple array.
		this._cache = [];
		
		// Check for gap. Big enough?
		//const minGap = this.config.radius * Math.PI / SVG_VIEW_BOX / 2;
		//this.config.segments.gap = Math.max(minGap, this.config.segments.gap);

		//this.config.styles = {...DEFAULT_SEGARC_CONFIG.styles, ...this.config.styles};
		//this.config.styles_bg = {...DEFAULT_SEGARC_CONFIG.styles_bg, ...this.config.styles_bg};
		
		// This arc is the scale belonging to another arc??
		if (this.config.isScale) {
			this._value = this.config.scale.max;
			//this.config.show.scale = false;
		} else {
		
			// Nope. I'm the main arc. Check if a scale is defined and clone myself with some options...
			if (this.config.show.scale) {
				var scaleConfig = {...this.config};
				scaleConfig.styles = {...this.config.styles};
				scaleConfig.styles_bg = {...this.config.styles_bg};
				scaleConfig.segments = {...this.config.segments};
				scaleConfig.scale = {...this.config.scale};
				scaleConfig.show = {...this.config.show};

				// Cloning done. Now set specific scale options.
				scaleConfig.show.scale = false;
				scaleConfig.isScale = true;
				scaleConfig.width = Utils.calculateDimension(1.5);
				scaleConfig.radius = this.config.radius - (this.config.width/2) + (scaleConfig.width/2) + (this.config.scale_offset);
				//this._segmentedArcScale = new SegmentedArc(this._parent, scaleConfig);
				this._segmentedArcScale = new SegmentedArcTool(this._parent, scaleConfig, argPos);
				const scaleId = this._segmentedArcScale.objectId;
			} else {
				this._segmentedArcScale = null;
			}
		}

		this._segmentAngles = [];
		this._segments = {};
		
		// Precalculate segments with start and end angle!
		this._arc = {};
		this._arc.size = Math.abs(this.config.end_angle - this.config.start_angle);
		this._arc.clockwise = this.config.end_angle > this.config.start_angle;
		this._arc.direction = this._arc.clockwise ? 1 : -1;
		
		// 2020.10.13 (see issue #5)
		// Use different calculation for parts to support colorstops, colorlists and segment counts instead of the currently used dash (degrees) value
		//
		
		// FIXEDCOLOR
		if (this.config.show.style == 'fixedcolor') {
		}
		// COLORLIST
		else if (this.config.show.style == 'colorlist') {
			// Get number of segments, and their size in degrees.
			this._segments.count = this.config.segments.colorlist.colors.length;
			this._segments.size = this._arc.size / this._segments.count;
			this._segments.gap = this.config.segments.colorlist.gap;
			this._segments.sizeList = [];
			for (var i = 0; i < this._segments.count; i++) {
				this._segments.sizeList[i] = this._segments.size;
			}
				
			// Use a running total for the size of the segments...
			var segmentRunningSize = 0;
			for (var i = 0; i < this._segments.count; i++) {
				this._segmentAngles[i] = {"boundsStart": this.config.start_angle + (segmentRunningSize * this._arc.direction),
																	"boundsEnd": this.config.start_angle + (segmentRunningSize + this._segments.sizeList[i] * this._arc.direction),
																	"drawStart": this.config.start_angle + (segmentRunningSize * this._arc.direction) + (this._segments.gap * this._arc.direction),
																	"drawEnd": this.config.start_angle + (segmentRunningSize + this._segments.sizeList[i] * this._arc.direction) - (this._segments.gap * this._arc.direction)};
				segmentRunningSize += this._segments.sizeList[i];
			}

			if (this.debug) console.log('colorstuff - COLORLIST', this._segments, this._segmentAngles);
			
		}
		// COLORSTOPS
		else if (this.config.show.style == 'colorstops') {
			// Get colorstops, remove outliers and make a key/value store...
			this._segments.colorStops = {};
			Object.keys(this.config.segments.colorstops.colors).forEach((key) => {
					if ((key >= this.config.scale.min) &&
							(key <= this.config.scale.max))
						this._segments.colorStops[key] = this.config.segments.colorstops.colors[key];
						
				});
				
			// Insert dummy stopcolor value for max value for easier lookup...
			this._segments.colorStops[this.config.scale.max] = 'black';
			
			this._segments.sortedStops = Object.keys(this._segments.colorStops).map(n => Number(n)).sort((a, b) => a - b);

			this._segments.count = this._segments.sortedStops.length - 1;
			this._segments.gap = this.config.segments.colorstops.gap;
			
			// Now depending on the colorstops and min/max values, calculate the size of each segment relative to the total arc size.
			// First color in the list starts from Min!
			
			var runningColorStop = this.config.scale.min;
			var scaleRange = this.config.scale.max - this.config.scale.min;
			this._segments.sizeList = [];
			for (var i = 0; i < this._segments.count; i++) {
				var colorSize = this._segments.sortedStops[i + 1] - runningColorStop;
				runningColorStop += colorSize;
				// Calculate fraction [0..1] of colorSize of min/max scale range
				const fraction = colorSize / scaleRange;
				const angleSize = fraction * this._arc.size;
				this._segments.sizeList[i] = angleSize;
			}
			
			// Use a running total for the size of the segments...
			var segmentRunningSize = 0;
			for (var i = 0; i < this._segments.count; i++) {
				this._segmentAngles[i] = {"boundsStart": this.config.start_angle + (segmentRunningSize * this._arc.direction),
																	"boundsEnd": this.config.start_angle + (segmentRunningSize + this._segments.sizeList[i] * this._arc.direction),
																	"drawStart": this.config.start_angle + (segmentRunningSize * this._arc.direction) + (this._segments.gap * this._arc.direction),
																	"drawEnd": this.config.start_angle + (segmentRunningSize + this._segments.sizeList[i] * this._arc.direction) - (this._segments.gap * this._arc.direction)};
				segmentRunningSize += this._segments.sizeList[i];
			}

			if (this.debug) console.log('colorstuff - COLORSTOPS', this._segments, this._segmentAngles);
		}
		// SIMPLEGRADIENT
		else if (this.config.show.style == 'simplegradient') {
		};
		
		// Just dump to console for verifiation. Nothing is used yet of the new calculation method...
		

		// testing. use below two lines and sckip the calculation of the segmentAngles. Those are done above with different calculation...
		this.skipOriginal = ((this.config.show.style == 'colorstops') || (this.config.show.style == 'colorlist'));
		
		// Set scale to new value. Never changes of course!!
		if (this.skipOriginal) {
			if (this.config.isScale) this._valuePrev = this._value;
			this._initialDraw = false;

		}
		
		this._arc.parts = Math.floor(this._arc.size / Math.abs(this.config.segments.dash));
		this._arc.partsPartialSize = this._arc.size - (this._arc.parts * this.config.segments.dash);
		
		if (this.skipOriginal) {
			this._arc.parts = this._segmentAngles.length;
			this._arc.partsPartialSize = 0;
		}
		else {
			for (var i=0; i< this._arc.parts; i++) {
				this._segmentAngles[i] = {"boundsStart": this.config.start_angle + (i * this.config.segments.dash * this._arc.direction),
																	"boundsEnd": this.config.start_angle + ((i + 1) * this.config.segments.dash * this._arc.direction),
																	"drawStart": this.config.start_angle + (i * this.config.segments.dash * this._arc.direction) + (this.config.segments.gap * this._arc.direction),
																	"drawEnd": this.config.start_angle + ((i + 1) * this.config.segments.dash * this._arc.direction) - (this.config.segments.gap * this._arc.direction)};
			}
			if (this._arc.partsPartialSize > 0) {
				this._segmentAngles[i] = {"boundsStart": this.config.start_angle + (i * this.config.segments.dash * this._arc.direction),
																	"boundsEnd": this.config.start_angle + ((i + 0) * this.config.segments.dash * this._arc.direction) +
																					(this._arc.partsPartialSize * this._arc.direction),

																	"drawStart": this.config.start_angle + (i * this.config.segments.dash * this._arc.direction) + (this.config.segments.gap * this._arc.direction),
																	"drawEnd": this.config.start_angle + ((i + 0) * this.config.segments.dash * this._arc.direction) +
																					(this._arc.partsPartialSize * this._arc.direction) - (this.config.segments.gap * this._arc.direction)};
			}
		}

		this.starttime = null;

		if (this.debug) console.log('SegmentedArcTool constructor coords, dimensions', this.coords, this.dimensions, this.svg, this.config);
		if (this.debug) console.log('SegmentedArcTool - init', this.toolId, this.config.isScale, this._segmentAngles);
	}

	get objectId() {
		return this.toolId;
	}
	
	set value(state) {
		if (this.debug) console.log('SegmentedArcTool - set value IN');

		if (this.config.isScale) return false;
		if (this._value == state) return false;
		
		this._valuePrev = this._value || state;
		this._value = state;
		this._valueIsDirty = true;
		return true;
	}
	
	// Me is updated. Get arc id for animations...
	firstUpdated(changedProperties)
	{
		if (this.debug) console.log('SegmentedArcTool - firstUpdated IN with _arcId/id', this._arcId, this.toolId, this.config.isScale);
		this._arcId = this._parent.shadowRoot.getElementById("arc-".concat(this.toolId));
		//const na = '';//this._arcId.querySelector();
		//const na = this._arcId.querySelector("arc-segment-".concat(this.Id).concat("-").concat(1));
		//const na2 = this._parent.shadowRoot.getElementById("arc-segment-".concat(this.Id).concat("-").concat(0));
		
		this._firstUpdatedCalled = true;

		// Just a try.
		// 
		// was this a bug. The scale was never called with updated. Hence always no arcId...
		this._segmentedArcScale?.firstUpdated(changedProperties);
		
		if (this.skipOriginal) {
			if (this.debug) console.log('RENDERNEW - firstUpdated IN with _arcId/id/isScale/scale/connected', this._arcId, this.toolId, this.config.isScale, this._segmentedArcScale, this._parent.connected);
			if (!this.config.isScale) this._valuePrev = null;
			this._initialDraw = true;
			// Huh? next call doesn't seem required to update / initiate animation???
			//this._parent.requestUpdate();
		}
	}
	
	updated(changedProperties) {
		if (this.debug) console.log('SegmentedArcTool - updated IN');
		// Element has updated. Now do the animation ???
		// let dateTime = new Date().getTime();
	}

	render() {

		if (this.debug) console.log('SegmentedArcTool RENDERNEW - Render IN');
    return svg`
			<g filter="url(#ds)" id="arc-${this.toolId}" class="arc">
				<g >
					${this._renderSegments()}
					</g>
				${this._renderScale()}
			</g>
		`;
	}

	_renderScale() {
		if (this._segmentedArcScale) return this._segmentedArcScale.render();
		
		//if (this.config.show.scale) this._segmentedArcScale.render();
	}
	
  _renderSegments() {

		// migrate to new solution to draw segmented arc...
		
		if (this.skipOriginal) {
			// Here we can rebuild all needed. Much will be the same I guess...

			// Added temp vars. animation doesn't work!!!!
			var arcStart = this.config.start_angle;
			var arcEnd = this.config.end_angle;
			var arcEndPrev = this.config.end_angle;
			var arcWidth = this.config.width;
			
			var arcEndFull = this.config.end_angle;
			var arcClockwise = arcEnd > arcStart;
			var arcPart = this.config.segments.dash;
			var arcDivider = this.config.segments.gap;

			// #TODO: must use this.dimensions
			var arcRadius = this.config.radius;
			

			if (this.debug) console.log('RENDERNEW - IN _arcId, firstUpdatedCalled', this._arcId, this._firstUpdatedCalled);
			// calculate real end angle depending on value set in object and min/max scale
			var val = Utils.calculateValueBetween(this.config.scale.min, this.config.scale.max, this._value);
			var valPrev = Utils.calculateValueBetween(this.config.scale.min, this.config.scale.max, this._valuePrev);
			if (val != valPrev) if (this.debug) console.log('RENDERNEW _renderSegments diff value old new', this.toolId, valPrev, val);

					arcEnd = (val * this._arc.size * this._arc.direction) + this.config.start_angle;
					arcEndPrev = (valPrev * this._arc.size * this._arc.direction) + this.config.start_angle;
			var arcSize = Math.abs(arcEnd - this.config.start_angle);
			var arcSizePrev = Math.abs(arcEndPrev - this.config.start_angle);

			// Styles are already converted to an Object {}...
			let configStyle = {...this.config.styles};
			const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

			// Draw background of segmented arc...
			let configStyleBg = {...this.config.styles_bg};
			const configStyleBgStr = JSON.stringify(configStyleBg).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

			var svgItems = [];

			for (var k = 0; k < this._segmentAngles.length; k++) {
				d = this.buildArcPath(this._segmentAngles[k].drawStart, this._segmentAngles[k].drawEnd,
															this._arc.clockwise, this.config.radius, this.config.width);

				svgItems.push(svg`<path id="arc-segment-bg-${this.toolId}-${k}" class="arc__segment"
														style="${configStyleBgStr}"
														d="${d}"
														/>`);

			}

			// Check if arcId does exist
			if (this._firstUpdatedCalled) {
//			if ((this._arcId)) {
				if (this.debug) console.log('RENDERNEW _arcId DOES exist', this._arcId, this.toolId, this._firstUpdatedCalled);

				// Render current from cache
				this._cache.forEach((item, index) => {
					d = item;

					// extra, set color from colorlist as a test
					var fill = this.config.color;
					if (this.config.show.style =="colorlist") {
						fill = this.config.segments.colorlist.colors[index];
					}
					if (this.config.show.style =="colorstops") {
						fill = this._segments.colorStops[this._segments.sortedStops[index]];
					}

					//if (this.debug) console.log('RENDERNEW _renderSegments - from cache', this.toolId, index, d);
					svgItems.push(svg`<path id="arc-segment-${this.toolId}-${index}" class="arc__segment"
														style="${configStyleStr} fill: ${fill};;"
														d="${d}"
														/>`);
				});

				var tween = {};
				
/*
With a very short animation duration, and small segments, only first segment is drawn.
It seems progress = 1 (ready), but runningAngle is 10.8 and frameAngle is 25.2, two segments ahead...
segment 1 - drawn, segment2 - not, segment3 - not. After new value, drawing starts at segment3...

{fromAngle: 0, toAngle: 25.200000000000003, runningAngle: 0, duration: 10, startTime: null}
duration: 10
frameAngle: 25.200000000000003
fromAngle: 0
progress: 1
runningAngle: 10.800000999999998
startTime: null
toAngle: 25.200000000000003
*/
				function animateSegmentsNEW(timestamp, thisTool){

						const easeOut = progress =>
							Math.pow(--progress, 5) + 1;

						var frameSegment;
						var runningSegment;

						var timestamp = timestamp || new Date().getTime()
						if (!tween.startTime) {
							tween.startTime = timestamp;
							tween.runningAngle = tween.fromAngle;
						}

						if (thisTool.debug) console.log('RENDERNEW - in animateSegmentsNEW', thisTool.toolId, tween);
						
						var runtime = timestamp - tween.startTime
						tween.progress = Math.min(runtime / tween.duration, 1);
						tween.progress = easeOut(tween.progress);
						
						const increase = ((thisTool._arc.clockwise) 
															? (tween.toAngle > tween.fromAngle) : (tween.fromAngle > tween.toAngle));

						// Calculate where the animation angle should be now in this animation frame: angle and segment.
						tween.frameAngle = tween.fromAngle + ((tween.toAngle - tween.fromAngle) * tween.progress);
						frameSegment = thisTool._segmentAngles.findIndex((currentValue, index) =>
								thisTool._arc.clockwise
								? ((tween.frameAngle <= currentValue.boundsEnd) && (tween.frameAngle >= currentValue.boundsStart))
								: ((tween.frameAngle <= currentValue.boundsStart) && (tween.frameAngle >= currentValue.boundsEnd)));
						
						if (frameSegment == -1) {
							if (thisTool.debug) console.log('RENDERNEW animateSegments frameAngle not found', tween, thisTool._segmentAngles);
						}
						
						// Check where we actually are now. This might be in a different segment...
						runningSegment = thisTool._segmentAngles.findIndex((currentValue, index) => 
								thisTool._arc.clockwise
								? ((tween.runningAngle <= currentValue.boundsEnd) && (tween.runningAngle >= currentValue.boundsStart))
								: ((tween.runningAngle <= currentValue.boundsStart) && (tween.runningAngle >= currentValue.boundsEnd)));

						// Do render segments until the animation angle is at the requested animation frame angle.
						do {
							
							var aniStartAngle = thisTool._segmentAngles[runningSegment].drawStart;
							var runningSegmentAngle = thisTool._arc.clockwise
																				? Math.min(thisTool._segmentAngles[runningSegment].boundsEnd, tween.frameAngle)
																				: Math.max(thisTool._segmentAngles[runningSegment].boundsEnd, tween.frameAngle);
							var aniEndAngle = thisTool._arc.clockwise
																	? Math.min(thisTool._segmentAngles[runningSegment].drawEnd, tween.frameAngle)
																	: Math.max(thisTool._segmentAngles[runningSegment].drawEnd, tween.frameAngle);
							// First phase. Just draw and ignore segments...
							d = thisTool.buildArcPath(aniStartAngle, aniEndAngle, thisTool._arc.clockwise, arcRadius, arcWidth);

							let as;
							const myarc = "arc-segment-".concat(thisTool.toolId).concat("-").concat(runningSegment);
							as = thisTool._parent.shadowRoot.getElementById(myarc);
							if (as) {
								var e = as.getAttribute("d");
								as.setAttribute("d", d);
								
								// We also have to set the style fill if the color stops and gradients are implemented
								// As we're using styles, attributes won't work. Must use as.style.fill = 'calculated color'
								// #TODO
								// Can't use gradients probably because of custom path. Conic-gradient would be fine.
								//
								// First try...
								if (thisTool.config.show.style =="colorlist") {
									as.style.fill = thisTool.config.segments.colorlist.colors[runningSegment];
								}
							}
							thisTool._cache[runningSegment] = d;
							
							// If at end of animation, don't do the add to force going to next segment 
							if (tween.frameAngle != runningSegmentAngle) {
								runningSegmentAngle = runningSegmentAngle + (0.000001 * thisTool._arc.direction);
							}

							var runningSegmentPrev = runningSegment;
							runningSegment = thisTool._segmentAngles.findIndex((currentValue, index) => 
								thisTool._arc.clockwise
								? ((runningSegmentAngle <= currentValue.boundsEnd) && (runningSegmentAngle >= currentValue.boundsStart))
								: ((runningSegmentAngle <= currentValue.boundsStart) && (runningSegmentAngle >= currentValue.boundsEnd)));		
							
							frameSegment = thisTool._segmentAngles.findIndex((currentValue, index) => 
								thisTool._arc.clockwise
								? ((tween.frameAngle <= currentValue.boundsEnd) && (tween.frameAngle >= currentValue.boundsStart))
								: ((tween.frameAngle <= currentValue.boundsStart) && (tween.frameAngle >= currentValue.boundsEnd)));		

							if (!increase) {
								if (runningSegmentPrev != runningSegment) {
									if (thisTool.debug) console.log('RENDERNEW movit - remove path', thisTool.toolId, runningSegmentPrev);
									if (thisTool._arc.clockwise) {
										as.removeAttribute("d");
										thisTool._cache[runningSegmentPrev] = null;
									} else {
										as.removeAttribute("d");
										thisTool._cache[runningSegmentPrev] = null;
									}
								}
							}
							tween.runningAngle = runningSegmentAngle;
							if (thisTool.debug) console.log('RENDERNEW - animation loop tween', thisTool.toolId, tween, runningSegment, runningSegmentPrev);
						} while ((tween.runningAngle != tween.frameAngle) /* && (runningSegment == runningSegmentPrev)*/);

						// NTS @ 2020.10.14
						// In a fast paced animation - say 10msec - multiple segments should be drawn, while tween.progress already has the value of 1.
						// This means only the first segment is drawn - due to the "&& (runningSegment == runningSegmentPrev)" test above.
						// To fix this:
						// - either remove that test (why was it there????)... Or
						// - add the line "|| (runningSegment != runningSegmentPrev)" to the if() below to make sure another animation frame is requested
						//   altough tween.progress == 1.
						if ((tween.progress != 1) /*|| (runningSegment != runningSegmentPrev)*/) {
								thisTool.rAFid = requestAnimationFrame(function(timestamp){
										animateSegmentsNEW(timestamp, thisTool)
								})
						} else {
							tween.startTime = null;
							if (thisTool.debug) console.log('RENDERNEW - animation loop ENDING tween', thisTool.toolId, tween, runningSegment, runningSegmentPrev);
						}
				} // function animateSegmentsNEW

				var mySelf = this; 
				var arcCur = arcEndPrev;
				
				// Check if values changed and we should animate to another target then previously rendered
				if ((val != valPrev) && (this._parent.connected == true) && (this._renderTo != this._value)) {
					this._renderTo = this._value;
					//if (this.debug) console.log('RENDERNEW val != valPrev', val, valPrev, 'prev/end/cur', arcEndPrev, arcEnd, arcCur);
					
					// If previous animation active, cancel this one before starting a new one...
					if (this.rAFid) {
						//if (this.debug) console.log('RENDERNEW cancelling rAFid', this._parent.cardId, this.toolId, 'rAFid', this.rAFid);
						cancelAnimationFrame(this.rAFid);
					}
					
					// Start new animation with calculated settings...
					// counter var not defined???
					//if (this.debug) console.log('starting animationframe timer...', this._parent.cardId, this.toolId, counter);
					tween.fromAngle = arcEndPrev;
					tween.toAngle = arcEnd;
					tween.runningAngle = arcEndPrev;
					tween.duration = Math.min(Math.max(500, this._initialDraw ? 500 : this.config.animation.duration * 1000), 5000);
					tween.startTime = null;
					if (this.debug) console.log('RENDERNEW - tween', this.toolId, tween);
					this._initialDraw = false;
					this.rAFid = requestAnimationFrame(function(timestamp){
																							animateSegmentsNEW(timestamp, mySelf)
					})
				};


				return svg`${svgItems}`;
				
				
			} else {
				// Initial FIRST draw.
				// What if we 'abuse' the animation to do this, and we just create empty elements.
				// Then we don't have to do difficult things.
				// Just set some values to 0 and 'force' a full animation...
				//
				// Hmm. Stuff is not yet rendered, so DOM objects don't exist yet. How can we abuse the
				// animation function to do the drawing then??
				// --> Can use firstUpdated perhaps?? That was the first render, then do the first actual draw??
				//
				
				if (this.debug) console.log('RENDERNEW _arcId does NOT exist', this._arcId, this.toolId);

				// Create empty elements, so no problem in animation function. All path's exist...
				// An empty element has a width of 0!
				for (var i=0; i < this._segmentAngles.length; i++) {
					d = this.buildArcPath(this._segmentAngles[i].drawStart, this._segmentAngles[i].drawEnd,
																this._arc.clockwise, this.config.radius, this.config.isScale ? this.config.width : 0);

					this._cache[i] = d;
					
					// extra, set color from colorlist as a test
					var fill = this.config.color;
					if (this.config.show.style =="colorlist") {
						fill = this.config.segments.colorlist.colors[i];
					}
					if (this.config.show.style =="colorstops") {
						fill = this._segments.colorStops[this._segments.sortedStops[i]];
					}
					
					svgItems.push(svg`<path id="arc-segment-${this.toolId}-${i}" class="arc__segment"
														style="${configStyleStr} fill: ${fill};"
														d="${d}"
														/>`);
				}
				
				if (this.debug) console.log('RENDERNEW - svgItems', svgItems, this._firstUpdatedCalled);
				return svg`${svgItems}`;

			}

		// END OF NEW METHOD OF RENDERING	
		} else {
			var arcStart = this.config.start_angle;
			var arcEnd = this.config.end_angle;
			var arcEndPrev = this.config.end_angle;
			var arcWidth = this.config.width;
			
			var arcEndFull = this.config.end_angle;
			var arcClockwise = arcEnd > arcStart;
			var arcPart = this.config.segments.dash;
			var arcDivider = this.config.segments.gap;

			// #TODO: must use this.dimensions
			var arcRadius = this.config.radius;
			
			// calculate real end angle depending on value set in object and min/max scale
			var val = Utils.calculateValueBetween(this.config.scale.min, this.config.scale.max, this._value);
			var valPrev = Utils.calculateValueBetween(this.config.scale.min, this.config.scale.max, this._valuePrev);
			if (val != valPrev) if (this.debug) console.log('_renderSegments diff value old new', this.toolId, valPrev, val);

			var arcSizeFull = Math.abs(arcEndFull - arcStart);

			arcEnd = (val * arcSizeFull * this._arc.direction) + arcStart;
			arcEndPrev = (valPrev * arcSizeFull* this._arc.direction) + arcStart;

			// Styles are already converted to an Object {}...
			let configStyle = {...this.config.styles};
			const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

			let configStyleBg = {...this.config.styles_bg};
			const configStyleBgStr = JSON.stringify(configStyleBg).slice(1, -1).replace(/"/g,"").replace(/,/g,"");
			
			var arcSize = Math.abs(arcEnd - arcStart);
			var arcSizePrev = Math.abs(arcEndPrev - arcStart);
			
			// Calc diff in arc size. Can be positive and negative.
			// Then get stepsize. We draw in 20 steps.
			var arcSizeDiff = arcSizePrev - arcSize;
			var arcStepSize = arcSizeDiff / 50;
			var arcChangeClockwise = (arcSize > arcSizePrev) ? true : false;
			
			var svgItems = [];
			
			var fullParts = Math.floor(arcSize/Math.abs(arcPart));
			var fullPartsAll = Math.floor(arcSizeFull/Math.abs(arcPart));

			var d;
			
			// Count what's left of the arc. Start with the full size...
			
			var arcRest = arcSize;

			// Draw background of segmented arc...
			for (var k = 0; k < this._segmentAngles.length; k++) {
				d = this.buildArcPath(this._segmentAngles[k].drawStart, this._segmentAngles[k].drawEnd,
															this._arc.clockwise, arcRadius, arcWidth);

				svgItems.push(svg`<path id="arc-segment-bg-${this.toolId}-${k}" class="arc__segment"
														style="${configStyleBgStr}"
														d="${d}"
														/>`);

			}

			// Now draw the arc itself...
			var arcPartStart;
			var arcPartEnd;

			
			// Check if arcId does exist
			if (this._arcId != null) {
				if (this.debug) console.log('_arcId does exist');

				// Render current from cache
				this._cache.forEach((item, index) => {
					d = item;
					//if (this.debug) console.log('_renderSegments - from cache', this.toolId, index, d);
					svgItems.push(svg`<path id="arc-segment-${this.toolId}-${index}" class="arc__segment"
														style="${configStyleStr};"
														d="${d}"
														/>`);
				});
				
				var tween = {};
				
				function animateSegments(timestamp, thisTool){

						const easeOut = progress =>
							Math.pow(--progress, 5) + 1;

						var frameSegment;
						var runningSegment;

						var timestamp = timestamp || new Date().getTime()
						if (!tween.startTime) {
							tween.startTime = timestamp;
							tween.runningAngle = tween.fromAngle;
						}

						var runtime = timestamp - tween.startTime
						tween.progress = Math.min(runtime / tween.duration, 1);
						tween.progress = easeOut(tween.progress);
						
						const increase = ((thisTool._arc.clockwise) 
															? (tween.toAngle > tween.fromAngle) : (tween.fromAngle > tween.toAngle));

						// Calculate where the animation angle should be now in this animation frame: angle and segment.
						tween.frameAngle = tween.fromAngle + ((tween.toAngle - tween.fromAngle) * tween.progress);
						frameSegment = thisTool._segmentAngles.findIndex((currentValue, index) =>
								thisTool._arc.clockwise
								? ((tween.frameAngle <= currentValue.boundsEnd) && (tween.frameAngle >= currentValue.boundsStart))
								: ((tween.frameAngle <= currentValue.boundsStart) && (tween.frameAngle >= currentValue.boundsEnd)));
						
						if (frameSegment == -1) {
							if (this.debug) console.log('animateSegments frameAngle not found', tween, thisTool._segmentAngles);
						}
						
						// Check where we actually are now. This might be in a different segment...
						runningSegment = thisTool._segmentAngles.findIndex((currentValue, index) => 
								thisTool._arc.clockwise
								? ((tween.runningAngle <= currentValue.boundsEnd) && (tween.runningAngle >= currentValue.boundsStart))
								: ((tween.runningAngle <= currentValue.boundsStart) && (tween.runningAngle >= currentValue.boundsEnd)));

						// Do render segments until the animation angle is at the requested animation frame angle.
						do {
							
							var aniStartAngle = thisTool._segmentAngles[runningSegment].drawStart;
							var runningSegmentAngle = thisTool._arc.clockwise
																				? Math.min(thisTool._segmentAngles[runningSegment].boundsEnd, tween.frameAngle)
																				: Math.max(thisTool._segmentAngles[runningSegment].boundsEnd, tween.frameAngle);
							var aniEndAngle = thisTool._arc.clockwise
																	? Math.min(thisTool._segmentAngles[runningSegment].drawEnd, tween.frameAngle)
																	: Math.max(thisTool._segmentAngles[runningSegment].drawEnd, tween.frameAngle);
							// First phase. Just draw and ignore segments...
							d = thisTool.buildArcPath(aniStartAngle, aniEndAngle, thisTool._arc.clockwise, arcRadius, arcWidth);

							let as;
							const myarc = "arc-segment-".concat(thisTool.toolId).concat("-").concat(runningSegment);
							as = thisTool._parent.shadowRoot.getElementById(myarc);
							if (as) {
								var e = as.getAttribute("d");
								as.setAttribute("d", d);
								
								// We also have to set the style fill if the color stops and gradients are implemented
								// As we're using styles, attributes won't work. Must use as.style.fill = 'calculated color'
								// #TODO
								// Can't use gradients probably because of custom path. Conic-gradient would be fine.
								//
								// First try...
								if (thisTool.config.show.style =="colorstops") {
									as.style.fill = thisTool.config.colorstops[runningSegment];
								}
							}
							thisTool._cache[runningSegment] = d;
							
							// If at end of animation, don't do the add to force going to next segment 
							if (tween.frameAngle != runningSegmentAngle) {
								runningSegmentAngle = runningSegmentAngle + (0.000001 * thisTool._arc.direction);
							}

							var runningSegmentPrev = runningSegment;
							runningSegment = thisTool._segmentAngles.findIndex((currentValue, index) => 
								thisTool._arc.clockwise
								? ((runningSegmentAngle <= currentValue.boundsEnd) && (runningSegmentAngle >= currentValue.boundsStart))
								: ((runningSegmentAngle <= currentValue.boundsStart) && (runningSegmentAngle >= currentValue.boundsEnd)));		
							
							frameSegment = thisTool._segmentAngles.findIndex((currentValue, index) => 
								thisTool._arc.clockwise
								? ((tween.frameAngle <= currentValue.boundsEnd) && (tween.frameAngle >= currentValue.boundsStart))
								: ((tween.frameAngle <= currentValue.boundsStart) && (tween.frameAngle >= currentValue.boundsEnd)));		

							if (!increase) {
								if (runningSegmentPrev != runningSegment) {
									if (this.debug) console.log('movit - remove path', thisTool.toolId, runningSegmentPrev);
									if (thisTool._arc.clockwise) {
										as.removeAttribute("d");
										thisTool._cache[runningSegmentPrev] = null;
									} else {
										as.removeAttribute("d");
										thisTool._cache[runningSegmentPrev] = null;
									}
								}
							}
							tween.runningAngle = runningSegmentAngle;
						} while ((tween.runningAngle != tween.frameAngle) && (runningSegment == runningSegmentPrev));

						if (tween.progress != 1) {
								thisTool.rAFid = requestAnimationFrame(function(timestamp){
										animateSegments(timestamp, thisTool)
								})
						} else {
							tween.startTime = null;
						}
				} // function animateSegments

				var mySelf = this; 
				var arcCur = arcEndPrev;
				
				// Check if values changed and we should animate to another target then previously rendered
				if ((val != valPrev) && (this._parent.connected == true) && (this._renderTo != this._value)) {
					this._renderTo = this._value;
					if (this.debug) console.log('val != valPrev', val, valPrev, 'prev/end/cur', arcEndPrev, arcEnd, arcCur);
					
					// If previous animation active, cancel this one before starting a new one...
					if (this.rAFid) {
						if (this.debug) console.log('cancelling rAFid', this._parent.cardId, this.toolId, 'rAFid', this.rAFid);
						cancelAnimationFrame(this.rAFid);
					}
					
					// Start new animation with calculated settings...
					// counter var not defined???
					//if (this.debug) console.log('starting animationframe timer...', this._parent.cardId, this.toolId, counter);
					tween.fromAngle = arcEndPrev;
					tween.toAngle = arcEnd;
					tween.runningAngle = arcEndPrev;
					tween.duration = Math.min(Math.max(500, this.config.animation.duration * 1000), 5000);
					tween.startTime = null;
					this.rAFid = requestAnimationFrame(function(timestamp){
																							animateSegments(timestamp, mySelf)
					})
				};
				return svg`${svgItems}`;

			} else {
				// FIRST draw! Do IT!
				if (this.debug) console.log('_arcId does NOT exist');

				for(var i = 0; i < fullParts; i++) {
					arcPartStart = this._segmentAngles[i].drawStart;
					arcPartEnd = this._segmentAngles[i].drawEnd;
					arcRest = arcRest - arcPart;
					
					d = this.buildArcPath(arcPartStart, arcPartEnd, arcClockwise, arcRadius, arcWidth);
					this._cache[i] = d;

					// extra, set color from colorlist as a test
					var fill = this.config.color;
					if (this.config.show.style =="colorstops") {
						fill = this.config.colorstops[i];
					}
					
					svgItems.push(svg`<path id="arc-segment-${this.toolId}-${i}" class="arc__segment"
															style="${configStyleStr} fill: ${fill};"
															d="${d}"
															/>`);
				}

				this.arcEnd = arcPartEnd;
				this.arcEndSegment = i;

				// Did we draw a single segment or not? If not, reset start & end to start...
				if (fullParts < 1) {
					arcPartStart = arcStart + (arcDivider * this._arc.direction);
					arcPartEnd = arcPartStart - (2 * arcDivider * this._arc.direction);
				}

				// If we have to draw the last partial arc, calculate size and draw it!

				if (arcRest > 0) {
					var lastPartStart = this._segmentAngles[i].drawStart;
					var lastPartEnd = this._segmentAngles[i].drawStart + (arcRest * this._arc.direction) - (arcDivider * this._arc.direction);
					d = this.buildArcPath(lastPartStart,
												lastPartEnd,
												arcClockwise,
												arcRadius, 
												arcWidth);

					this._cache[i] = d;
					svgItems.push(svg`<path id="arc-segment-${this.toolId}-${i}" class="arc__segment"
														style="${configStyleStr}"
														d="${d}"
														/>`);
					this.arcEnd = lastPartEnd;
					this.arcEndSegment = i;
					i += 1;
				}
				
				// create empty elements, so no problem in animation function. All path's exist...
				for (var j=i; j < fullPartsAll; j++) {
					arcPartStart = this._segmentAngles[j].drawStart;
					arcPartEnd = this._segmentAngles[j].drawStart;

					d = this.buildArcPath(arcPartStart,
												arcPartStart,
												arcClockwise,
												arcRadius, 
												0);
					this._cache[j] = d;
					svgItems.push(svg`<path id="arc-segment-${this.toolId}-${j}" class="arc__segment"
														style="${configStyleStr}"
														d="${d}"
														/>`);
				}
				

				return svg`${svgItems}`;
			}
		}
	}
	
	
	polarToCartesian(centerX, centerY, radius, angleInDegrees) {
		var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

		return {
			x: centerX + (radius * Math.cos(angleInRadians)),
			y: centerY + (radius * Math.sin(angleInRadians))
		};
	}

	/*
	 *
	 * start = 10, end = 30, clockwise -> size is 20
	 * start = 10, end = 30, anticlockwise -> size is (360 - 20) = 340
	 *
	 * NTS:
	 * using in*** for arguments? Much clearer while reading the code 
	 * and the config thing should go to. Leftover from example...
	 *
	 */
	buildArcPath(argStartAngle, argEndAngle, argClockwise, argRadius, argWidth) {

		var start = this.polarToCartesian(this.coords.cx, this.coords.cy, argRadius, argEndAngle);
		var end = this.polarToCartesian(this.coords.cx, this.coords.cy, argRadius, argStartAngle);
		var largeArcFlag = Math.abs(argEndAngle - argStartAngle) <= 180 ? "0" : "1";
		
		const sweepFlag = argClockwise ? "0": "1";
	
		var cutoutRadius = argRadius - argWidth,
			start2 = this.polarToCartesian(this.coords.cx, this.coords.cy, cutoutRadius, argEndAngle),
			end2 = this.polarToCartesian(this.coords.cx, this.coords.cy, cutoutRadius, argStartAngle),

		d = [
			"M", start.x, start.y,
			"A", argRadius, argRadius, 0, largeArcFlag, sweepFlag, end.x, end.y,
			"L", end2.x, end2.y,
			"A", cutoutRadius, cutoutRadius, 0, largeArcFlag, sweepFlag == "0" ? "1": "0", start2.x, start2.y,
			"Z",
		].join(" ");
		return d;
	}
} // END of class

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// https://github.com/d3/d3-selection/blob/master/src/selection/data.js
//

//=============================================================================
//=============================================================================
//=============================================================================

class devSwissArmyKnifeCard extends LitElement {
  constructor() {
    super();

		this.connected = false;

    // Get cardId for unique SVG gradient Id
		this.cardId = Math.random().toString(36).substr(2, 9);
		this.entities = [];
		this.entitiesStr = [];
		this.attributesStr = [];
		this.viewBoxSize = SVG_VIEW_BOX;
		this.viewBox = {"width": SVG_VIEW_BOX, "height": SVG_VIEW_BOX};
		//this.colorStops = {};
    this.animations = {};
    this.animations.lines = {};
    this.animations.vlines = {};
    this.animations.hlines = {};
    this.animations.circles = {};
    this.animations.rectangles = {};
    this.animations.icons = {};
    this.animations.names = {};
    this.animations.areas = {};
    this.animations.states = {};
		
		this.vbars = [];
		this.rects = [];
		this.tools = [];
		
		// For history query interval updates.
		this.stateChanged = true;
		this.updating = false;
		this.update_interval = 300;
		
		// http://jsfiddle.net/jlubean/dL5cLjxt/
		this.isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
		this.iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		
		if (this.debug) console.log('*****Event - card - constructor', this.cardId, new Date().getTime());
  }

 /*******************************************************************************
	* Summary.
	*	Implements the properties method
	*
	*/
/*
  static get properties() {
    return {
      hass: {},
      config: {},
			states: [],
			statesStr: [],

      dashArray: String,
			color1_offset: String,
			color0: String,
			color1: String,
			angleCoords: Object
    }
  }
*/	
 /*******************************************************************************
	* styles()
	*
	* Summary.
	*	Returns the static CSS styles for the lit-element
	*
	* Note:
	*	- The BEM (http://getbem.com/naming/) naming style for CSS is used
	*		Of course, if no mistakes are made ;-)
	*
	*/
  static get styles() {
		
    return css`
			:host {
				cursor: pointer;
			}

			@media (print), (prefers-reduced-motion: reduce) {
				.animated {
					animation-duration: 1ms !important;
					transition-duration: 1ms !important;
					animation-iteration-count: 1 !important; 
				}
			}			

			@keyframes zoomOut {
				from {
					opacity: 1;
				}

				50% {
					opacity: 0;
					transform: scale3d(0.3, 0.3, 0.3);
				}

				to {
					opacity: 0;
				}
			}

			@keyframes bounce {
				from,
				20%,
				53%,
				80%,
				to {
				animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
				transform: translate3d(0, 0, 0);
				}

				40%,
				43% {
				animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
				transform: translate3d(0, -30px, 0);
				}

				70% {
				animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
				transform: translate3d(0, -15px, 0);
				}

				90% {
				transform: translate3d(0, -4px, 0);
				}
			}

			@keyframes flash {
				from,
				50%,
				to {
				opacity: 1;
				}

				25%,
				75% {
				opacity: 0;
				}
			}

			@keyframes headShake {
				0% {
				transform: translateX(0);
				}

				6.5% {
				transform: translateX(-6px) rotateY(-9deg);
				}

				18.5% {
				transform: translateX(5px) rotateY(7deg);
				}

				31.5% {
				transform: translateX(-3px) rotateY(-5deg);
				}

				43.5% {
				transform: translateX(2px) rotateY(3deg);
				}

				50% {
				transform: translateX(0);
				}
			}

			@keyframes heartBeat {
				0% {
				transform: scale(1);
				}

				14% {
				transform: scale(1.3);
				}

				28% {
				transform: scale(1);
				}

				42% {
				transform: scale(1.3);
				}

				70% {
				transform: scale(1);
				}
			}

			@keyframes jello {
				from,
				11.1%,
				to {
				transform: translate3d(0, 0, 0);
				}

				22.2% {
				transform: skewX(-12.5deg) skewY(-12.5deg);
				}

				33.3% {
				transform: skewX(6.25deg) skewY(6.25deg);
				}

				44.4% {
				transform: skewX(-3.125deg) skewY(-3.125deg);
				}

				55.5% {
				transform: skewX(1.5625deg) skewY(1.5625deg);
				}

				66.6% {
				transform: skewX(-0.78125deg) skewY(-0.78125deg);
				}

				77.7% {
				transform: skewX(0.390625deg) skewY(0.390625deg);
				}

				88.8% {
				transform: skewX(-0.1953125deg) skewY(-0.1953125deg);
				}
			}

			@keyframes pulse {
				from {
				transform: scale3d(1, 1, 1);
				}

				50% {
				transform: scale3d(1.05, 1.05, 1.05);
				}

				to {
				transform: scale3d(1, 1, 1);
				}
			}

			@keyframes rubberBand {
				from {
				transform: scale3d(1, 1, 1);
				}

				30% {
				transform: scale3d(1.25, 0.75, 1);
				}

				40% {
				transform: scale3d(0.75, 1.25, 1);
				}

				50% {
				transform: scale3d(1.15, 0.85, 1);
				}

				65% {
				transform: scale3d(0.95, 1.05, 1);
				}

				75% {
				transform: scale3d(1.05, 0.95, 1);
				}

				to {
				transform: scale3d(1, 1, 1);
				}
			}

			@keyframes shake {
				from,
				to {
				transform: translate3d(0, 0, 0);
				}

				10%,
				30%,
				50%,
				70%,
				90% {
				transform: translate3d(-10px, 0, 0);
				}

				20%,
				40%,
				60%,
				80% {
				transform: translate3d(10px, 0, 0);
				}
			}

			@keyframes swing {
				20% {
				transform: rotate3d(0, 0, 1, 15deg);
				}

				40% {
				transform: rotate3d(0, 0, 1, -10deg);
				}

				60% {
				transform: rotate3d(0, 0, 1, 5deg);
				}

				80% {
				transform: rotate3d(0, 0, 1, -5deg);
				}

				to {
				transform: rotate3d(0, 0, 1, 0deg);
				}
			}

			@keyframes tada {
				from {
				transform: scale3d(1, 1, 1);
				}
				10%,
				20% {
				transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
				}
				30%,
				50%,
				70%,
				90% {
				transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
				}
				40%,
				60%,
				80% {
				transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
				}
				to {
				transform: scale3d(1, 1, 1);
				}
			}


			@keyframes wobble {
				from {
				transform: translate3d(0, 0, 0);
				}
				15% {
				transform: translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg);
				}
				30% {
				transform: translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg);
				}
				45% {
				transform: translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg);
				}
				60% {
				transform: translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg);
				}
				75% {
				transform: translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg);
				}
				to {
				transform: translate3d(0, 0, 0);
				}
			}


			@media screen and (min-width: 467px) {
			  :host {
				font-size: 12px;
			  }
			}
			@media screen and (max-width: 466px) {
			  :host {
				font-size: 12px;
			  }
			}

		  :host ha-card {
            padding: 0px 0px 0px 0px;
		  }
		  
			.container {
				position: relative;
				height: 100%;
				display: flex;
				flex-direction: column;
			}

			.labelContainer {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 65%;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: flex-end;
			}

		  .ellipsis {
				text-overflow: ellipsis;
				white-space: nowrap;
				overflow: hidden;
      }          

		  .state {
				position: relative;
				display: flex;
				flex-wrap: wrap;
				max-width: 100%;
				min-width: 0px;
		  }
		  
			#label {
				display: flex;
				line-height: 1;
			}
			
			#label.bold {
				font-weight: bold;
			}
			
			#label, #name {
				margin: 3% 0;
			}

			.text {
				font-size: 100%;
			}
          
		  #name {
			font-size: 80%;
			font-weight: 300;
		  }
		  
			.unit {
				font-size: 65%;
				font-weight: normal;
				opacity: 0.6;
				line-height: 2em;
				vertical-align: bottom;
				margin-left: 0.25rem;
      }
		  
		  .entity__area {
				position: absolute;
				top: 70%;
				font-size: 120%;
				opacity: 0.6;
				display: flex;
				line-height: 1;
				align-items: center;
				justify-content: center;
				width: 100%;
				height: 20%;
				flex-direction: column;
		  }

			.nam {
				alignment-baseline: central;
				fill: var(--primary-text-color);
			}
			
			.state__uom {
				font-size: 20px;
				opacity: 0.7;
				margin: 0;
				fill : var(--primary-text-color);
			}

			.state__value {
				font-size: 3em;
				opacity: 1;
				fill : var(--primary-text-color);
				text-anchor: middle;
			}
			.entity__name {
				text-anchor: middle;
				overflow: hidden;
				opacity: 0.8;
				fill : var(--primary-text-color);
				font-size: 1.5em;
				text-transform: uppercase;
				letter-spacing: 0.1em;
			}

			.entity__area {
				font-size: 12px;
				opacity: 0.7;
				overflow: hidden;
				fill : var(--primary-text-color);
				text-anchor: middle;
				text-transform: uppercase;
				letter-spacing: 0.1em;
			}

			.shadow {
				font-size: 30px;
				font-weight: 700;
				text-anchor: middle;
			}

			.card--dropshadow-5 {
				filter:	drop-shadow(0 1px 0 #ccc)
               drop-shadow(0 2px 0 #c9c9c9)
               drop-shadow(0 3px 0 #bbb)
               drop-shadow(0 4px 0 #b9b9b9)
               drop-shadow(0 5px 0 #aaa)
               drop-shadow(0 6px 1px rgba(0,0,0,.1))
               drop-shadow(0 0 5px rgba(0,0,0,.1))
               drop-shadow(0 1px 3px rgba(0,0,0,.3))
               drop-shadow(0 3px 5px rgba(0,0,0,.2))
               drop-shadow(0 5px 10px rgba(0,0,0,.25))
               drop-shadow(0 10px 10px rgba(0,0,0,.2))
               drop-shadow(0 20px 20px rgba(0,0,0,.15));
			}
			.card--dropshadow-medium--opaque--sepia90 {
				filter: drop-shadow(0.0em 0.05em 0px #b2a98f22)
								drop-shadow(0.0em 0.07em 0px #b2a98f55)
								drop-shadow(0.0em 0.10em 0px #b2a98f88)
								drop-shadow(0px 0.6em 0.9em rgba(0,0,0,0.15))
								drop-shadow(0px 1.2em 0.15em rgba(0,0,0,0.1))
								drop-shadow(0px 2.4em 2.5em rgba(0,0,0,0.1))
								sepia(90%);
			}

			.card--dropshadow-heavy--sepia90 {
				filter: drop-shadow(0.0em 0.05em 0px #b2a98f22)
								drop-shadow(0.0em 0.07em 0px #b2a98f55)
								drop-shadow(0.0em 0.10em 0px #b2a98f88)
								drop-shadow(0px 0.3em 0.45em rgba(0,0,0,0.5))
								drop-shadow(0px 0.6em 0.07em rgba(0,0,0,0.3))
								drop-shadow(0px 1.2em 1.25em rgba(0,0,0,1))
								drop-shadow(0px 1.8em 1.6em rgba(0,0,0,0.1))
								drop-shadow(0px 2.4em 2.0em rgba(0,0,0,0.1))
								drop-shadow(0px 3.0em 2.5em rgba(0,0,0,0.1))
								sepia(90%);
			}

			.card--dropshadow-heavy {
				filter: drop-shadow(0.0em 0.05em 0px #b2a98f22)
								drop-shadow(0.0em 0.07em 0px #b2a98f55)
								drop-shadow(0.0em 0.10em 0px #b2a98f88)
								drop-shadow(0px 0.3em 0.45em rgba(0,0,0,0.5))
								drop-shadow(0px 0.6em 0.07em rgba(0,0,0,0.3))
								drop-shadow(0px 1.2em 1.25em rgba(0,0,0,1))
								drop-shadow(0px 1.8em 1.6em rgba(0,0,0,0.1))
								drop-shadow(0px 2.4em 2.0em rgba(0,0,0,0.1))
								drop-shadow(0px 3.0em 2.5em rgba(0,0,0,0.1));
			}

			.card--dropshadow-medium--sepia90 {
				filter: drop-shadow(0.0em 0.05em 0px #b2a98f)
								drop-shadow(0.0em 0.15em 0px #b2a98f)
								drop-shadow(0.0em 0.15em 0px #b2a98f)
								drop-shadow(0px 0.6em 0.9em rgba(0,0,0,0.15))
								drop-shadow(0px 1.2em 0.15em rgba(0,0,0,0.1))
								drop-shadow(0px 2.4em 2.5em rgba(0,0,0,0.1))
								sepia(90%);
			}

			.card--dropshadow-medium {
				filter: drop-shadow(0.0em 0.05em 0px #b2a98f)
								drop-shadow(0.0em 0.15em 0px #b2a98f)
								drop-shadow(0.0em 0.15em 0px #b2a98f)
								drop-shadow(0px 0.6em 0.9em rgba(0,0,0,0.15))
								drop-shadow(0px 1.2em 0.15em rgba(0,0,0,0.1))
								drop-shadow(0px 2.4em 2.5em rgba(0,0,0,0.1));
			}

			.card--dropshadow-light--sepia90 {
				filter: drop-shadow(0px 0.10em 0px #b2a98f)
								drop-shadow(0.1em 0.5em 0.2em rgba(0, 0, 0, .5))
								sepia(90%);
			}

			.card--dropshadow-light {
				filter: drop-shadow(0px 0.10em 0px #b2a98f)
								drop-shadow(0.1em 0.5em 0.2em rgba(0, 0, 0, .5));
			}

			.card--dropshadow-down-and-distant {
				filter: drop-shadow(0px 0.05em 0px #b2a98f)
								drop-shadow(0px 14px 10px rgba(0,0,0,0.15)
								drop-shadow(0px 24px 2px rgba(0,0,0,0.1))
								drop-shadow(0px 34px 30px rgba(0,0,0,0.1));
			}
			.card--filter-none {
			}

			.horseshoe__svg__group {
				transform: translateY(15%);
			}
			
			.line__horizontal {
				stroke: var(--primary-text-color);
				opacity: 0.3;
				stroke-width: 2;
			}

			.line__vertical {
				stroke: var(--primary-text-color);
				opacity: 0.3;
				stroke-width: 2;
			}
			
			.svg__dot {
				fill: var(--primary-text-color);
				opacity: 0.5;
				align-self: center;
				transform-origin: 50% 50%;
			}
			
			.icon {
				align: center;
			}
			
		`;
  }

 /*******************************************************************************
	* hass()
	*
	* Summary.
	*	Updates hass data for the card
	*
	*/

  set hass(hass) {
		// Set ref to hass, use "_"for the name ;-)
		if (this.debug) console.log('*****Event - set hass', this.cardId, new Date().getTime());
		this._hass = hass;
		
		if (!this.connected) {
			if (this.debug) console.log('set hass but NOT connected', this.cardId);

		// 2020.02.10 Troubels with connectcallback late, so windows are not yet calculated. ie 
		// things around icons go wrong...
		// what if return is here..
			//return;
		}
	
		var entityHasChanged = false;
		
		// Update state strings and check for changes.
		// Only if changed, continue and force render
		var value;
		var index = 0;
		var attrSet = false;
		var newStateStr;
		for (value of this.config.entities) {
			this.entities[index] = hass.states[this.config.entities[index].entity];

			// Get attribute state if specified and available
			if (this.config.entities[index].attribute) {
				if (this.entities[index].attributes[this.config.entities[index].attribute]) {
					newStateStr = this._buildState(this.entities[index].attributes[this.config.entities[index].attribute], this.config.entities[index]);
					if (newStateStr != this.attributesStr[index]) {
						this.attributesStr[index] = newStateStr;
						entityHasChanged = true;
					}
					attrSet = true;
				}
			}
			if (!attrSet) {
				newStateStr = this._buildState(this.entities[index].state, this.config.entities[index]);
				if (newStateStr != this.entitiesStr[index]) {
					this.entitiesStr[index] = newStateStr;
					entityHasChanged = true;
				}
			}
			
			index++;
		}

		if (!entityHasChanged) {
			return;
		}

    // Check for animations linked to an entity or attribute.
		// Set the dynamic animation depending on the state.
		// If the card is rendered, the render() functions will take this dynamic animation into account.
		//
		// #TODO: Determine animation only if specific state or attribute has changed...
    
		
		// TODO for SAK:
		// Push animation to object. Let object handle the animation change and request a render.
		// Or has the isDirty flag, which is fetched from here.
		//
		// - if animation state is entity state
		// 		- push or start animation for object/tool using animation id and entity index of some kind.
		//			must be connected somehow. is tat only via animation_index ???
		//		- this.tools[].animate(item (= animation, yes??))
		//
		// -	maybe tool.configureAnimation(animation);
		//	-	tool.data = state;
		//	==> tool will check for animation itself!
		//
		//	Then everything in one place. Much easier to maintain and check!!!!!
		//	- new tool(argParent, argPos);
		//	-	tool.setConfig(argLayout);
		//	- tool.setAnimation(argAnimation);
		//	- tool.setValue(argValue / argState);
		//	- tool.setSeries(argSeries); // for history data bar charts
		//
		if (this.config.animations) Object.keys(this.config.animations).map(animation => {
      const entityIndex = animation.substr(Number(animation.indexOf('.') + 1));
      this.config.animations[animation].map(item => {
        // if animation state not equals sensor state, return... Nothing to animate for this state...
				if (this.entities[entityIndex].state.toLowerCase() != item.state.toLowerCase()) return;
        
        if (item.vlines) {
          item.vlines.map(item2 => {
            if (!this.animations.vlines[item2.animation_id] || !item2.reuse) this.animations.vlines[item2.animation_id] = {};
            this.animations.vlines[item2.animation_id] = Object.assign(this.animations.vlines[item2.animation_id], ...item2.styles);
          })
        }
        
        if (item.hlines) {
          item.hlines.map(item2 => {
            if (!this.animations.hlines[item2.animation_id] || !item2.reuse) this.animations.hlines[item2.animation_id] = {};
            this.animations.hlines[item2.animation_id] = Object.assign(this.animations.hlines[item2.animation_id], ...item2.styles);
          })
        }

        if (item.circles) {
          item.circles.map(item2 => {
            if (!this.animations.circles[item2.animation_id]  || !item2.reuse) this.animations.circles[item2.animation_id] = {};
            this.animations.circles[item2.animation_id] = Object.assign(this.animations.circles[item2.animation_id], ...item2.styles);
          })
        }

        if (item.icons) {
          item.icons.map(item2 => {
            if (!this.animations.icons[item2.animation_id] || !item2.reuse) this.animations.icons[item2.animation_id] = {};
            this.animations.icons[item2.animation_id] = Object.assign(this.animations.icons[item2.animation_id], ...item2.styles);
          })
        }

        if (item.states) {
          item.states.map(item2 => {
            if (!this.animations.states[item2.animation_id] || !item2.reuse) this.animations.states[item2.animation_id] = {};
            this.animations.states[item2.animation_id] = Object.assign(this.animations.states[item2.animation_id], ...item2.styles);
          })
        }
        
      });
    });
		
		// NOTE:
		// Tool knows via this.config if entity_index and animation_index are specified.
		// So one can check this for EVERY object, and consequently push data into the tool.
		//
		// how is history done??? ie series data. Now only for barcharts, fixed.
		// if tool.needsSeries() then entityid = tool.entityId; -> fetch history from hass
		// if history received --> tool.setSeries(history);
		//
		if (this.tools) {
			this.tools.map((item, index) => {
				if (true || item.type == "segarct") {
					if (this.debug) console.log('set hass - SegmentedArcTool found', item, index);
					if ((item.tool.config.hasOwnProperty('entity_index')))
					{
						if (this.debug) console.log('set hass - SegmentedArcTool set value', typeof item.tool.value);

						item.tool.value = this.attributesStr[item.tool.config.entity_index]
																								? this.attributesStr[item.tool.config.entity_index]
																								: this.entitiesStr[item.tool.config.entity_index];
					}
					
				}
			});
		}
		
		// For now, always force update to render the card if any of the states or attributes have changed...
    if ((entityHasChanged) && (this.connected)) { this.requestUpdate();}
  }

 /*******************************************************************************
	* setConfig()
	*
	* Summary.
	*	Sets/Updates the card configuration. Rarely called if the doc is right 
	*
	*/

  setConfig(config) {
		if (this.debug) console.log('*****Event - setConfig', this.cardId, new Date().getTime());
		config = JSON.parse(JSON.stringify(config))

		if (this.debug) console.log('setConfig', this.cardId);

		const aspectRatios = new Map([
			["1/1", {"width": 1 * SVG_DEFAULT_DIMENSIONS, "height": 1 * SVG_DEFAULT_DIMENSIONS}],
			["2/2", {"width": 2 * SVG_DEFAULT_DIMENSIONS, "height": 2 * SVG_DEFAULT_DIMENSIONS}],
			["3/3", {"width": 3 * SVG_DEFAULT_DIMENSIONS, "height": 3 * SVG_DEFAULT_DIMENSIONS}],
			["4/4", {"width": 4 * SVG_DEFAULT_DIMENSIONS, "height": 4 * SVG_DEFAULT_DIMENSIONS}],
			["5/5", {"width": 5 * SVG_DEFAULT_DIMENSIONS, "height": 5 * SVG_DEFAULT_DIMENSIONS}],
			["6/6", {"width": 6 * SVG_DEFAULT_DIMENSIONS, "height": 6 * SVG_DEFAULT_DIMENSIONS}],

			["2/1", {"width": 2 * SVG_DEFAULT_DIMENSIONS, "height": 1 * SVG_DEFAULT_DIMENSIONS}],

			["3/1", {"width": 3 * SVG_DEFAULT_DIMENSIONS, "height": 1 * SVG_DEFAULT_DIMENSIONS}],
			["3/2", {"width": 3 * SVG_DEFAULT_DIMENSIONS, "height": 2 * SVG_DEFAULT_DIMENSIONS}],

			["4/1", {"width": 4 * SVG_DEFAULT_DIMENSIONS, "height": 1 * SVG_DEFAULT_DIMENSIONS}],
			["4/2", {"width": 4 * SVG_DEFAULT_DIMENSIONS, "height": 2 * SVG_DEFAULT_DIMENSIONS}],
			["4/3", {"width": 4 * SVG_DEFAULT_DIMENSIONS, "height": 3 * SVG_DEFAULT_DIMENSIONS}],

			["5/1", {"width": 5 * SVG_DEFAULT_DIMENSIONS, "height": 1 * SVG_DEFAULT_DIMENSIONS}],
			["5/2", {"width": 5 * SVG_DEFAULT_DIMENSIONS, "height": 2 * SVG_DEFAULT_DIMENSIONS}],
			["5/3", {"width": 5 * SVG_DEFAULT_DIMENSIONS, "height": 3 * SVG_DEFAULT_DIMENSIONS}],
			["5/4", {"width": 5 * SVG_DEFAULT_DIMENSIONS, "height": 4 * SVG_DEFAULT_DIMENSIONS}],

			["6/1", {"width": 6 * SVG_DEFAULT_DIMENSIONS, "height": 1 * SVG_DEFAULT_DIMENSIONS}],
			["6/2", {"width": 6 * SVG_DEFAULT_DIMENSIONS, "height": 2 * SVG_DEFAULT_DIMENSIONS}],
			["6/3", {"width": 6 * SVG_DEFAULT_DIMENSIONS, "height": 3 * SVG_DEFAULT_DIMENSIONS}],
			["6/4", {"width": 6 * SVG_DEFAULT_DIMENSIONS, "height": 4 * SVG_DEFAULT_DIMENSIONS}],
			["6/5", {"width": 6 * SVG_DEFAULT_DIMENSIONS, "height": 5 * SVG_DEFAULT_DIMENSIONS}],

			["1/2", {"width": 1 * SVG_DEFAULT_DIMENSIONS, "height": 2 * SVG_DEFAULT_DIMENSIONS}],

			["1/3", {"width": 1 * SVG_DEFAULT_DIMENSIONS, "height": 3 * SVG_DEFAULT_DIMENSIONS}],
			["2/3", {"width": 2 * SVG_DEFAULT_DIMENSIONS, "height": 3 * SVG_DEFAULT_DIMENSIONS}],

			["1/4", {"width": 1 * SVG_DEFAULT_DIMENSIONS, "height": 4 * SVG_DEFAULT_DIMENSIONS}],
			["2/4", {"width": 2 * SVG_DEFAULT_DIMENSIONS, "height": 4 * SVG_DEFAULT_DIMENSIONS}],
			["3/4", {"width": 3 * SVG_DEFAULT_DIMENSIONS, "height": 4 * SVG_DEFAULT_DIMENSIONS}],

			["1/5", {"width": 1 * SVG_DEFAULT_DIMENSIONS, "height": 5 * SVG_DEFAULT_DIMENSIONS}],
			["2/5", {"width": 2 * SVG_DEFAULT_DIMENSIONS, "height": 5 * SVG_DEFAULT_DIMENSIONS}],
			["3/5", {"width": 3 * SVG_DEFAULT_DIMENSIONS, "height": 5 * SVG_DEFAULT_DIMENSIONS}],
			["4/5", {"width": 4 * SVG_DEFAULT_DIMENSIONS, "height": 5 * SVG_DEFAULT_DIMENSIONS}],

			["1/6", {"width": 1 * SVG_DEFAULT_DIMENSIONS, "height": 6 * SVG_DEFAULT_DIMENSIONS}],
			["2/6", {"width": 2 * SVG_DEFAULT_DIMENSIONS, "height": 6 * SVG_DEFAULT_DIMENSIONS}],
			["3/6", {"width": 3 * SVG_DEFAULT_DIMENSIONS, "height": 6 * SVG_DEFAULT_DIMENSIONS}],
			["4/6", {"width": 4 * SVG_DEFAULT_DIMENSIONS, "height": 6 * SVG_DEFAULT_DIMENSIONS}],
			["5/6", {"width": 5 * SVG_DEFAULT_DIMENSIONS, "height": 6 * SVG_DEFAULT_DIMENSIONS}],

		]);
		
		this.dimensions = "1/1";
		
		if (config.dimensions) this.dimensions = config.dimensions;
		this.viewBox = aspectRatios.get(this.dimensions);

		
    if (!config.entities) {
      throw Error('No entities defined');
    }
    if (!config.layout) {
      throw Error('No layout defined');
    }
    // testing
    if (config.entities) {
      const newdomain = this._computeDomain(config.entities[0].entity);
      if (newdomain != 'sensor') {
        // If not a sensor, check if attribute is a number. If so, continue, otherwise Error...
        if (config.entities[0].attribute && !isNaN(config.entities[0].attribute)) {
          throw Error('First entity or attribute must be a numbered sensorvalue, but is NOT');
        }
      }        
    }

		const newConfig = {
      texts: [],
			card_filter: 'card--filter-none',
			...config,
		}
		
		// Set default tap_action, if none given for an entity
		newConfig.entities.forEach((entity, i) => {
			if (!entity.tap_action) {
				newConfig.entities[i].tap_action = {action: 'more-info'};
			}
		}
		);

		// #TODO must be removed after removal of segmented arcs part below
		this.config = newConfig;
		
		
		const toolsNew = {
			"area": EntityAreaTool,
			"badge": BadgeTool,
			"bar": SparkleBarChartTool,
			"circle": CircleTool,
			"ellipse": EllipseTool,
			"horseshoe": HorseshoeTool,
			"icon": EntityIconTool,
			"line": LineTool,
			"name": EntityNameTool,
			"segarct": SegmentedArcTool,
			"state": EntityStateTool,
			"slider": RangeSliderTool,
		}
//			"state": EntityStateTool,
//			"icon": EntityIconTool,
		

		// #TODO 2020.10.14
		// - Merge templates into the toolsets (formerly groups) and tools (formerly tools)
		// - Create a list of toolsets with tools, rather than only a list of tools
		// - toolset == group
		// - tool    == tool
		// 
		// So we get:
		// toolsets -> list of toolsets -> tools -> list of tools.
		// this.toolsets[].tools[].
		//
		if (this.config.layout.toolsets) {
if (this.debug) console.log('config layout toolsets FCFG', this.config);
if (this.debug) console.log('config layout toolsets', this.config.layout.toolsets);
			this.config.layout.toolsets.map(toolset => {

				if (toolset.tools) {
					toolset.tools.map(poep => {
						var argConfig = {...poep};
						if (this.debug) console.log('argConfig', toolset, argConfig);

						var argPos = { cx: toolset.position.cx / 100 * SVG_DEFAULT_DIMENSIONS,
													 cy: toolset.position.cy / 100 * SVG_DEFAULT_DIMENSIONS,
													 scale: toolset.position.scale ? toolset.position.scale : 1 };

						const newTool = new toolsNew[poep.tool](this, argConfig, argPos);
						this.tools.push({type: poep.tool, index: poep.id, tool: newTool});
					});
				}

			});
			
		}
			
	// Template test. 2020.09.30
	// Seems to work...
	if (this.config.templates) {
		if (this.config.toolsets) {
			let tools = Templates.replaceVariables(this.config.toolsets[1].variables, this.config.templates[0]);
			if (this.debug) console.log('template, tools are: ', tools);
		}
	}

	if ((config.debug) && (config.debug == true)) if (this.debug) console.log('debug - setConfig', this.cardId, this.config);
	}

 /*******************************************************************************
	* connectedCallback()
	*
	* Summary.
	*
	*/
  connectedCallback() {
		if (this.debug) console.log('*****Event - connectedCallback', this.cardId, new Date().getTime());
		this.connected = true;
    super.connectedCallback();
		
		if (this.update_interval) {
      this.updateOnInterval();
      this.interval = setInterval(
        () => this.updateOnInterval(),
        this.update_interval * 1000,
      );
		}
		if (this.debug) console.log('ConnectedCallback', this.cardId);
		this.requestUpdate();
  }

 /*******************************************************************************
	* disconnectedCallback()
	*
	* Summary.
	*
	*/
  disconnectedCallback() {
		if (this.debug) console.log('*****Event - disconnectedCallback', this.cardId, new Date().getTime());
    if (this.interval) {
      clearInterval(this.interval);
		}			
    super.disconnectedCallback();
		if (this.debug) console.log('disconnectedCallback', this.cardId);
		this.connected = false;
  }

 /*******************************************************************************
	* firstUpdated()
	*
	* Summary.
	*
	*/
  firstUpdated(changedProperties) {

		if (this.debug) console.log('*****Event - firstUpdated', this.cardId, new Date().getTime());

		if (this.tools) {
			this.tools.map((item, index) => {
				if (item.type == "segarct") {
					if (this.debug) console.log('firstUpdated - calling SegmentedArcTool firstUpdated');
					item.tool.firstUpdated(changedProperties);
					//this.tools[index].firstUpdated(changedProperties);
				}
			});
		}

		
		if (this.tools[4].type == "slider") {
			this.tools[4].tool.firstUpdated(changedProperties);
		}

		// Force rerender after first update.
		// Seems to be required to render the icons correctly on iOS / Safari devices.
 		this.requestUpdate();
	}


 /*******************************************************************************
	* updated()
	*
	* Summary.
	*
	*/
  updated(changedProperties) {

		if (this.debug) console.log('*****Event - Updated', this.cardId, new Date().getTime());

		// #TODO
		// Add/check this for tool/tool list. They an implement the updated function/callback
/*		if (this.segmentedArcs)
		{
			this.segmentedArcs.map(item => {
				item.updated(changedProperties);
			})
		}
*/
  }



 /*******************************************************************************
	* render()
	*
	* Summary.
	* Renders the complete SVG based card according to the specified layout in which
	* the user can specify name, area, entities, lines and dots.
	* The horseshoe is rendered on the full card. This one can be moved a bit via CSS.
	*
	*/

  render({ config } = this) {

		if (this.debug) console.log('*****Event - render', this.cardId, new Date().getTime());

		if (!this.connected) {
			if (this.debug) console.log('render but NOT connected', this.cardId, new Date().getTime());
			return;
		}

    return html`
      <ha-card>
				<div class="container" id="container">
					${this._renderSvg()}
				</div>
      </ha-card>
    `;

		// #TODO The svg style part must move to rendering horseshoetool I guess
    return html`
      <ha-card
      >
				<div class="container" id="container">
					${this._renderSvg()}
				</div>

			<svg style="width:0;height:0;position:absolute;" aria-hidden="true" focusable="false">
				<linearGradient gradientTransform="rotate(0)" id="horseshoe__gradient-${this.cardId}" x1="${this.angleCoords.x1}", y1="${this.angleCoords.y1}", x2="${this.angleCoords.x2}" y2="${this.angleCoords.y2}">
					<stop offset="${this.color1_offset}" stop-color="${this.color1}" />
					<stop offset="100%" stop-color="${this.color0}" />
				</linearGradient>
			</svg>
      </ha-card>
    `;
  }

/*      <ha-card
        @click=${e => this.handlePopup(e, this.entities[0])}
      >
*/
/*******************************************************************************
	* renderTickMarks()
	*
	* Summary.
	* Renders the tick marks on the scale.
	*
	*/

  _renderTickMarks() {
		const { config, } = this;
		if (!config) return;
		if (!config.show) return;
		if (!config.show.scale_tickmarks) return;
		
		const stroke = config.horseshoe_scale.color ? config.horseshoe_scale.color : 'var(--primary-background-color)';
		const tickSize = config.horseshoe_scale.ticksize ? config.horseshoe_scale.ticksize
										: (config.horseshoe_scale.max - config.horseshoe_scale.min) / 10;
		
		// fullScale is 260 degrees. Hard coded for now...
		const fullScale = 260;
		const remainder = config.horseshoe_scale.min % tickSize;
		const startTickValue = config.horseshoe_scale.min + (remainder == 0 ? 0 : (tickSize - remainder));
		const startAngle = ((startTickValue - config.horseshoe_scale.min) /
												(config.horseshoe_scale.max - config.horseshoe_scale.min)) * fullScale;
		var tickSteps = ((config.horseshoe_scale.max - startTickValue) / tickSize);
		
		// new
		var steps = Math.floor(tickSteps);
		const angleStepSize = (fullScale - startAngle) / tickSteps;
		
		// If steps exactly match the max. value/range, add extra step for that max value.
		if ((Math.floor(((steps) * tickSize) + startTickValue)) <= (config.horseshoe_scale.max)) {steps++;}
		
		const radius = config.horseshoe_scale.width ? config.horseshoe_scale.width / 2 : 6/2;
		var angle;
		var scaleItems = [];

    // NTS:
    // Value of -230 is weird. Should be -220. Can't find why...
		var i;
		for (i = 0; i < steps; i++) {
			angle = startAngle + ((-230 + (360 - i*angleStepSize)) * Math.PI / 180);
			scaleItems[i] = svg`
				<circle cx="${50 + 50 - Math.sin(angle)*TICKMARKS_RADIUS_SIZE}"
								cy="${50 + 50 - Math.cos(angle)*TICKMARKS_RADIUS_SIZE}" r="${radius}"
								fill="${stroke}">
			`;
		}
		return svg`${scaleItems}`;
	}

	_RenderTools() {

if (this.debug) console.log('all the tools in renderTools', this.tools);

						
		return svg`
						<g id="datatoolset" class="datatoolset">
							${this.tools.map(tool => tool.tool.render())}
							${this._renderIcons()}
							${this._renderUserSvgs()}
						</g>


						<defs>
							<marker viewBox="0 0 200 200" id="markerCircle" markerWidth="8" markerHeight="8" refX="5" refY="5">
									<circle cx="5" cy="5" r="3" style="stroke: none; fill:currentColor;"/>
							</marker>

							<marker viewBox="0 0 200 200" id="markerArrow" markerWidth="13" markerHeight="13" refX="2" refY="6"
										 orient="auto">
									<path d="M2,2 L2,11 L10,6 L2,2" style="fill: currentColor;" />
							</marker>

							<filter id="ds2" width="10" height="10">
								<feDropShadow dx="2" dy="3" stdDeviation="0.5"/>
							</filter>

							<filter id="ds3" x="0" y="0" width="200%" height="200%">
								<feOffset result="offOut" in="SourceAlpha" dx="20" dy="20" />
								<feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
								<feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
							</filter>
							
							<filter id="ds4" x="0" y="0" width="200%" height="200%">
								<feGaussianBlur stdDeviation="1" />
							</filter>

							<filter id="ds" width="200%" height="200%">
								<feDropShadow dx="0" dy="1.5" stdDeviation=".3"/>
							</filter>

						</defs>
		`;
	}


/*******************************************************************************
	* _renderSvg()
	*
	* Summary.
	* Renders the SVG
	*
	* NTS:
	* If height and width given for svg it equals the viewbox. The card is not scaled
	* anymore to the full dimensions of the card given by hass/lovelace.
	* Card or svg is also placed default at start of viewport (not box), and can be
	* placed at start, center or end of viewport (Use align-self to center it).
	*
	* 1. 	If height and width are ommitted, the ha-card/viewport is forced to the x/y
	* 		aspect ratio of the viewbox, ie 1:1. EXACTLY WHAT WE WANT!
	* 2.	If height and width are set to 100%, the viewport (or ha-card) forces the 
	* 		aspect-ratio on the svg. Although GetCardSize is set to 4, it seems the
	*			height is forced to 150px, so part of the viewbox/svg is not shown or
	*			out of proportion!
	* 3.	Setting the height/width also to 200/200 (same as viewbox), the horseshoe is
	*			displayed correctly, but doesn't scale to the max space of the ha-card/viewport.
	*			It also is displayed at the start of the viewport. For a large horizontal
	*			card this is ok, but in other cases, the center position would be better...
	*			- use align-self: center on the svg ...or...
	*			- use align-items: center on the parent container of the svg.
	*
	*/
  _renderSvg() {
		// For some reason, using a var/const for the viewboxsize doesn't work.
		// Even if the Chrome inspector shows 200 200. So hardcode for now!
		const { viewBoxSize, } = this;
		
		const cardFilter = this.config.card_filter ? this.config.card_filter : 'card--filter-none';

		const svgItems = [];
		switch (this.dimensions) {
			case "1/1": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 200 200'>
									${this._RenderTools()}`);
									break;
			case "2/2": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 400 400'>
									${this._RenderTools()}`);
									break;
			case "3/3": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 600 600'>
									${this._RenderTools()}`);
									break;
			case "4/4": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 800 800'>
									${this._RenderTools()}`);
									break;
			case "2/1": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 400 200'>
									${this._RenderTools()}`);
									break;
			case "3/1": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 600 200'>
									${this._RenderTools()}`);
									break;
			case "3/2": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 600 400'>
									${this._RenderTools()}`);
									break;
			case "4/1": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 800 200'>
									${this._RenderTools()}`);
									break;
			case "4/2": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 800 400'>
									${this._RenderTools()}`);
									break;
			case "4/3": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 800 600'>
									${this._RenderTools()}`);
									break;
			case "1/2": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 200 400'>
									${this._RenderTools()}`);
									break;
			case "1/3": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 200 600'>
									${this._RenderTools()}`);
									break;
			case "2/3": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 400 600'>
									${this._RenderTools()}`);
									break;
			case "1/4": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 200 800'>
									${this._RenderTools()}`);
									break;
			case "2/4": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 400 800'>
									${this._RenderTools()}`);
									break;
			case "3/4": svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 600 800'>
									${this._RenderTools()}`);
									break;
			default: svgItems.push(svg`<svg xmlns=http://www/w3.org/2000/svg" xmlns:xlink="http://www/w3.org/1999/xlink"
									class="${cardFilter}"
									viewbox='0 0 200 200'>
									${this._RenderTools()}`);
									break;
		}

		return svg`${svgItems}`;
  }


	_renderUserSvg(item) {
		return svg`${unsafeSVG(item.data)}`;
	}

  _renderUserSvgs() {
    const {
      layout,
    } = this.config.layout; // was this.config.layout

		if (this.config.debug) if (this.debug) console.log('debug - _renderUserSvgs IN', this.config);
		//if (!svgs) return;
		if (!this.config.svgs) return;

		if (this.config.debug) if (this.debug) console.log('debug - _renderUserSvgs IN2');
		
		const svgItems = this.config.svgs.map(item => {

			return svg`
				<g>
					<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />
					<path d="m 0 0 h 50 v 10 l 5 5 l -5 5 l 0 10 h -50 z " stroke-width="2" stroke="#fff" fill="#aaa"/>
					${unsafeSVG(item.data)}
				</g>
			`;
//this._renderUserSvg(item)}
		})

		if (this.config.debug) if (this.debug) console.log('debug - _renderUserSvgs OUT', svgItems);
		return svg`${svgItems}`;		
	}

/*******************************************************************************
	* _renderIcon()
	*
	* Summary.
	* Renders a single icon.
	*
	*/

	_renderIcon(item) {

	if (!item) return;

  item.entity = item.entity ? item.entity : 0;
  
	// get icon size, and calculate the foreignObject position and size. This must match the icon size
	// 1em = FONT_SIZE pixels, so we can calculate the icon size, and x/y positions of the foreignObject
	// the viewport is 200x200, so we can calulate the offset.
	//
	// NOTE:
	// Safari doesn't use the svg viewport for rendering of the foreignObject, but the real clientsize.
	// So positioning an icon doesn't work correctly...
	
	var iconSize = item.icon_size ? item.icon_size : 2;
	var iconPixels = iconSize * FONT_SIZE;
	const x = item.cx ? item.cx / 100 : 0.5;
	const y = item.cy ? item.cy / 100 : 0.5;
	
	const align = item.align ? item.align : 'center';
	const adjust = (align == 'center' ? 0.5 : (align == 'start' ? -1 : +1));

//	const parentClientWidth = this.parentElement.clientWidth;
	const clientWidth = this.clientWidth; // hard coded adjust for padding...
	const correction = clientWidth / this.viewBox.width;

	var xpx = (x * this.viewBox.width);
	var ypx = (y * this.viewBox.height);

	
	if ((this.isSafari) || (this.iOS)) {
		iconSize = iconSize * correction;

		xpx = (xpx * correction) - (iconPixels * adjust * correction);
		ypx = (ypx * correction) - (iconPixels * 0.5 * correction) - (iconPixels * 0.25 * correction);// - (iconPixels * 0.25 / 1.86);
	} else {
		// Get x,y in viewbox dimensions and center with half of size of icon.
		// Adjust horizontal for aligning. Can be 1, 0.5 and -1
		// Adjust vertical for half of height... and correct for 0.25em textfont to align.
		xpx = xpx - (iconPixels * adjust);
		ypx = ypx - (iconPixels * 0.5) - (iconPixels * 0.25);
	}

  // Get configuration styles as the default styles
  let configStyle = {};
//  if (item.styles) configStyle = Object.assign(configStyle, ...item.styles);
  if (item.styles) configStyle = {...configStyle, ...item.styles};
  
  // Get the runtime styles, caused by states & animation settings
  let stateStyle = {};
  if (this.animations.icons[item.animation_id])
    stateStyle = Object.assign(stateStyle, this.animations.icons[item.animation_id]);

  // Merge the two, where the runtime styles may overwrite the statically configured styles
  configStyle = { ...configStyle, ...stateStyle};
  
  // Convert javascript records to plain text, without "{}" and "," between the styles.
  const configStyleStr = JSON.stringify(configStyle).slice(1, -1).replace(/"/g,"").replace(/,/g,"");

  const icon = this._buildIcon(this.entities[item.entity_index], this.config.entities[item.entity_index]);
	
	return svg`
	<g @click=${e => this.handlePopup(e, this.entities[item.entity_index])}>
		<foreignObject width="${iconSize}em" height="${iconSize}em" x="${xpx}" y="${ypx}">
			<body>
				<div class="icon">
					<ha-icon .icon=${icon} style="--mdc-icon-size:100%;align-self:center;${configStyleStr}";></ha-icon>
				</div>
			</body>
		</foreignObject>
		<g>
		`;
	}

/*******************************************************************************
	* _renderIcons()
	*
	* Summary.
	* Renders all the icons in the list.
	*
	*/
	
  _renderIcons() {
    const {
      layout,
    } = this.config;

		if (!layout) return;
		if (!layout.icons) return;		
		
		const svgItems = layout.icons.map(item => {
			return svg`
					${this._renderIcon(item)}
				`;
		})

		return svg`${svgItems}`;	
  }

/*******************************************************************************
	* _handleClick()
	*
	* Summary.
	* Processes the mouse click of the user and dispatches the event to the 
	* configure handler.
	* At this moment, only 'more-info' is used!
	*
	* Credits:
	*	All credits to the mini-graph-card for this function.
	*
	*/

	_handleClick(node, hass, config, actionConfig, entityId) {
		let e;
		// eslint-disable-next-line default-case
		switch (actionConfig.action) {
			case 'more-info': {
				e = new Event('hass-more-info', { composed: true });
				e.detail = { entityId };
				node.dispatchEvent(e);
				break;
			}
			case 'navigate': {
				if (!actionConfig.navigation_path) return;
				window.history.pushState(null, '', actionConfig.navigation_path);
				e = new Event('location-changed', { composed: true });
				e.detail = { replace: false };
				window.dispatchEvent(e);
				break;
			}
			case 'call-service': {
				if (!actionConfig.service) return;
				const [domain, service] = actionConfig.service.split('.', 2);
				const serviceData = { ...actionConfig.service_data };
				hass.callService(domain, service, serviceData);
			}
		}
	}

/*******************************************************************************
	* handlePopup()
	*
	* Summary.
	* Handles the first part of mouse click processing.
	* It stops propagation to the parent and processes the event.
	* 
  * The action can be configured per entity. Look-up the entity, and handle the click
  * event for further processing.
	*
	* Credits:
	*	Almost all credits to the mini-graph-card for this function.
	*
	*/

  handlePopup(e, entity) {
    e.stopPropagation();

    this._handleClick(this, this._hass, this.config,
      this.config.entities[this.config.entities.findIndex(
        function(element, index, array){return element.entity == entity.entity_id})]
          .tap_action, entity.entity_id);
  }

/*******************************************************************************
	* _buildArea()
	*
	* Summary.
	* Builds the Area string.
	*
	*/

  _buildArea(entityState, entityConfig) {
    return (
      entityConfig.area
      || '?'
    );
  }

/*******************************************************************************
	* _buildName()
	*
	* Summary.
	* Builds the Name string.
	*
	*/

  _buildName(entityState, entityConfig) {
    return (
      entityConfig.name
      || entityState.attributes.friendly_name
    );
  }

/*******************************************************************************
	* _buildIcon()
	*
	* Summary.
	* Builds the Icon specification name.
	*
	*/
  _buildIcon(entityState, entityConfig) {
    return (
      entityConfig.icon
      || entityState.attributes.icon
    );
  }
 
 /*******************************************************************************
	* _buildUom()
	*
	* Summary.
	* Builds the Unit of Measurement string.
	*
	*/

  _buildUom(entityState, entityConfig) {
    return (
      entityConfig.unit
      || entityState.attributes.unit_of_measurement
      || ''
    );
  }

/*******************************************************************************
	* _buildState()
	*
	* Summary.
	* Builds the State string.
	*	If state is not a number, the state is returned AS IS, otherwise the state
	* is build according to the specified number of decimals.
	*
	*/

  _buildState(inState, entityConfig) {
		if (isNaN(inState))
      return inState;

    const state = Number(inState);

    if (entityConfig.decimals === undefined || Number.isNaN(entityConfig.decimals) || Number.isNaN(state))
      return Math.round(state * 100) / 100;

    const x = 10 ** entityConfig.decimals;
    return (Math.round(state * x) / x).toFixed(entityConfig.decimals);
  }
        
 
 /*******************************************************************************
	* _computeState()
	*
	* Summary.
	*
	*/

  _computeState(inState, dec) {
    
    if (isNaN(inState))
      return inState;

    const state = Number(inState);

    if (dec === undefined || Number.isNaN(dec) || Number.isNaN(state))
      return Math.round(state * 100) / 100;

    const x = 10 ** dec;
    return (Math.round(state * x) / x).toFixed(dec);
  }

 /*******************************************************************************
	* _calculateColor()
	*
	* Summary.
	*
	*/

  _calculateColor(argState, argStops, argIsGradient) {
    const sortedStops = Object.keys(argStops).map(n => Number(n)).sort((a, b) => a - b);
    let start, end, val;
    const l = sortedStops.length;
    
		if (argState <= sortedStops[0]) {
      return argStops[sortedStops[0]];
    } else if (argState >= sortedStops[l - 1]) {
      return argStops[sortedStops[l - 1]];
    } else {
      for (let i = 0; i < l - 1; i++) {
        const s1 = sortedStops[i];
        const s2 = sortedStops[i + 1];
        if (argState >= s1 && argState < s2) {
          [start, end] = [argStops[s1], argStops[s2]];
          if (!argIsGradient) {
            return start;
          }
          val = this._calculateValueBetween(s1, s2, argState);
          break;
        }
      }
    }
    return this._getGradientValue(start, end, val);
  }

 /*******************************************************************************
	* _calculateValueBetween()
	*
	* Summary.
	*	Clips the argValue value between argStart and argEnd, and returns the between value ;-)
	*
	*/

  _calculateValueBetween(argStart, argEnd, argValue) {
    return (Math.min(Math.max(argValue, argStart), argEnd) - argStart) / (argEnd - argStart);
  }

 /*******************************************************************************
	* _getColorVariable()
	*
	* Summary.
	*	Get value of CSS color variable, specified as var(--color-value)
	* These variables are defined in the lovelace element so it appears...
	*
	*/

	_getColorVariable(argColor) {
		const newColor = argColor.substr(4, argColor.length-5);

		if (!this.lovelace) {
			const root = document.querySelector('home-assistant');
			const main = root.shadowRoot.querySelector('home-assistant-main');
			const drawer_layout = main.shadowRoot.querySelector('app-drawer-layout');
			const pages = drawer_layout.querySelector('partial-panel-resolver');
			this.lovelace = pages.querySelector('ha-panel-lovelace');
		} else { }

		const returnColor = window.getComputedStyle(this.lovelace).getPropertyValue(newColor);
		return returnColor;
	}

 /*******************************************************************************
	* _getGradientValue()
	*
	* Summary.
	*	Get gradient value of color as a result of a color_stop.
	* An RGBA value is calculated, so transparancy is possible...
	*
	* The colors (colorA and colorB) can be specified as:
	*	- a css variable, var(--color-value)
	*	- a hex value, #fff or #ffffff
	*	-	an rgb() or rgba() value
	*	- a hsl() or hsla() value 
	*	- a named css color value, such as white.
	*
	*/
	
  _getGradientValue(argColorA, argColorB, argValue) {
	
		const resultColorA = this._colorToRGBA(argColorA);
		const resultColorB = this._colorToRGBA(argColorB);
		
		// We have a rgba() color array from cache or canvas.
		// Calculate color in between, and return #hex value as a result.
		// 

    const v1 = 1 - argValue;
    const v2 = argValue;
    const rDec = Math.floor((resultColorA[0] * v1) + (resultColorB[0] * v2));
    const gDec = Math.floor((resultColorA[1] * v1) + (resultColorB[1] * v2));
    const bDec = Math.floor((resultColorA[2] * v1) + (resultColorB[2] * v2));
		const aDec = Math.floor((resultColorA[3] * v1) + (resultColorB[3] * v2));

		// And convert full RRGGBBAA value to #hex.
    const rHex = this._padZero(rDec.toString(16));
    const gHex = this._padZero(gDec.toString(16));
    const bHex = this._padZero(bDec.toString(16));
    const aHex = this._padZero(aDec.toString(16));
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }
  _padZero(argValue) {
    if (argValue.length < 2) {
      argValue = `0${argValue}`;
    }
    return argValue.substr(0, 2);
  }

  _computeDomain(entityId) {
    return entityId.substr(0, entityId.indexOf('.'));
  }

  _computeEntity(entityId) {
    return entityId.substr(entityId.indexOf('.') + 1);
  }

 /*******************************************************************************
	* _colorToRGBA()
	*
	* Summary.
	*	Get RGBA color value of argColor.
	*
	* The argColor can be specified as:
	*	- a css variable, var(--color-value)
	*	- a hex value, #fff or #ffffff
	*	-	an rgb() or rgba() value
	*	- a hsl() or hsla() value 
	*	- a named css color value, such as white.
	*
	*/
	
	_colorToRGBA(argColor) {
		// return color if found in colorCache...
		if (argColor in this.colorCache) {
			return this.colorCache[argColor];
		}
		
		var theColor = argColor;
		// Check for 'var' colors
		let a0 = argColor.substr(0,3);
		if (a0.valueOf() === 'var') {
			theColor = this._getColorVariable(argColor);
		}

		// Get color from canvas. This always returns an rgba() value...
		var canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		var ctx = canvas.getContext('2d');

		ctx.clearRect(0, 0, 1, 1);
		ctx.fillStyle = theColor;
		ctx.fillRect(0, 0, 1, 1);
		const outColor = [ ...ctx.getImageData(0, 0, 1, 1).data ];
		
		this.colorCache[argColor] = outColor;
		return outColor;
	}
	
  updateOnInterval() {
		//return;
    if (this.stateChanged && !this.updating) {
      this.stateChanged = false;
      this.updateData();
    }
  }

  async fetchRecent(entityId, start, end, skipInitialState) {
    let url = 'history/period';
    if (start) url += `/${start.toISOString()}`;
    url += `?filter_entity_id=${entityId}`;
    if (end) url += `&end_time=${end.toISOString()}`;
    if (skipInitialState) url += '&skip_initial_state';
    return this._hass.callApi('GET', url);
  }
	
	async updateData({ config } = this) {
    this.updating = true;

    // We have a list of objects that might need some history update
		// Create list to fetch.
		let entityList = [{}];
		var j = 0;
		
		// #TODO
		// Lookup in this.tools for bars, or better tools that need history...
		// get that entity_index for that object
		// add to list...
		this.tools.map((item, i) => {
			if (item.type == "bar") {
				const end = new Date();
				const start = new Date();
				start.setHours(end.getHours() - item.tool.config.hours);
				const attr = this.config.entities[item.tool.config.entity_index].attribute ? this.config.entities[item.tool.config.entity_index].attribute : null;

				entityList[j] = ({"entityIndex": item.tool.config.entity_index, "entityId": this.entities[item.tool.config.entity_index].entity_id, "attrId": attr, "start": start, "end": end, "type": "bar", "idx": i});
				j++;
			}
		});

		if (this.vbars.length > 0) {
			this.vbars.map((item, i) => {
				const end = new Date();
				const start = new Date();
				start.setHours(end.getHours() - item.config.hours);
				const attr = this.config.entities[item.config.entity_index].attribute ? this.config.entities[item.config.entity_index].attribute : null;

				entityList[j] = ({"entityIndex": item.config.entity_index, "entityId": this.entities[item.config.entity_index].entity_id, "attrId": attr, "start": start, "end": end, "type": "vbars", "idx": i});
				j++;
			});
		}

		// if (this.config.layout.vbars) {
			// this.config.layout.vbars.map((item, i) => {
				// const end = new Date();
				// const start = new Date();
				// start.setHours(end.getHours() - this.vbars[i].config.hours);
				// const attr = this.config.entities[item.entity_index].attribute ? this.config.entities[item.entity_index].attribute : null;

				// entityList[j] = ({"entityIndex": item.entity_index, "entityId": this.entities[item.entity_index].entity_id, "attrId": attr, "start": start, "end": end, "type": "vbars", "idx": i});
				// j++;
			// });
		// }
		if (this.config.layout.hbars) {
			this.config.layout.hbars.map((item, i) => {
				const end = new Date();
				const start = new Date();
				start.setHours(end.getHours() - this.hbars[i].config.hours);
				const attr = this.config.entities[item.entity_index].attribute ? this.config.entities[item.entity_index].attribute : null;

				entityList[j] = ({"entityIndex": item.entity_index, "entityId": this.entities[item.entity_index].entity_id, "attrId": attr, "start": start, "end": end, "type": "hbars", "idx": i});
				j++;
			});
		}
		
		// const end = new Date();
		// const start = new Date();
    // start.setHours(end.getHours() - 24);
		
		//const entity = this.entities[3];

    try {
//      const promise = this.config.layout.vbars.map((item, i) => this.updateEntity(item, entity, i, start, end));
      const promise = entityList.map((item, i) => this.updateEntity(item, i, item.start, item.end));
      await Promise.all(promise);
    } finally {
      this.updating = false;
    }
	}
	async updateEntity(entity, index, initStart, end) {

    let stateHistory = [];
    let start = initStart;
    let skipInitialState = false;

//		this.entities[item.entity_index].entity_id)
		
		// Get history for this entity and/or attribute.
    let newStateHistory = await this.fetchRecent(entity.entityId, start, end, skipInitialState);

		// Now we have some history, check if it has valid data and filter out either the entity state or 
		// the entity attribute. Ain't that nice!
		
    let theState = entity.state;
		if (newStateHistory[0] && newStateHistory[0].length > 0) {
			if (entity.attrId) {
				theState = this.entities[entity.entityIndex].attributes[this.config.entities[entity.entityIndex].attribute];
				entity.state = theState;
			};
      newStateHistory = newStateHistory[0].filter(item => entity.attrId ? !Number.isNaN(parseFloat(item.attributes[entity.attrId])) : !Number.isNaN(parseFloat(item.state)));

//      newStateHistory = newStateHistory[0].filter(item => !Number.isNaN(parseFloat(item.state)));
      newStateHistory = newStateHistory.map(item => ({
        last_changed: item.last_changed,
        state: entity.attrId ? Number(item.attributes[entity.attrId]) : Number(item.state)
//        state: 16
      }));
      //newStateHistory = newStateHistory.filter(item => !Number.isNaN(parseFloat(item.state)));

		}
			
    stateHistory = [...stateHistory, ...newStateHistory];
	
		// this.hours=24;
		// this.points=1;
		
		this.uppdate(entity, stateHistory);
		return;
	}

	uppdate(entity, hist) {
		if (!hist) return;
		
		const getMin = (arr, val) => arr.reduce((min, p) => (
					Number(p[val]) < Number(min[val]) ? p : min
					), arr[0]);

		const getAvg = (arr, val) => arr.reduce((sum, p) => (
			sum + Number(p[val])
		), 0) / arr.length;
		
    const now = new Date().getTime();
    
		var hours = 24;
		var barhours = 2;
		
		if (entity.type == 'bar') {
			if (this.debug) console.log('entity.type == bar', entity);
			hours = this.tools[entity.idx].tool.config.hours;
			barhours = this.tools[entity.idx].tool.config.barhours;
		}

		if (entity.type == 'hbars') {
			hours = this.hbars[entity.idx].config.hours;
			barhours = this.hbars[entity.idx].config.barhours;
		}

		if (entity.type == 'vbars') {
			hours = this.vbars[entity.idx].config.hours;
			barhours = this.vbars[entity.idx].config.barhours;
		}
		
			
		const reduce = (res, item) => {
      const age = now - new Date(item.last_changed).getTime();
//      const interval = (age / (1000 * 3600) * this.points) - this.hours * this.points;
      const interval = (age / (1000 * 3600) / barhours) - (hours / barhours);
      const key = Math.floor(Math.abs(interval));
      if (!res[key]) res[key] = [];
      res[key].push(item);
      return res;
    };
    const coords = hist.reduce((res, item) => reduce(res, item), []);
    coords.length = Math.ceil(hours / barhours);

		// If no intervals found, return...
		if (Object.keys(coords).length == 0) {
			return;
		}
		
		// That STUPID STUPID Math.min/max can't handle empty arrays which are put into it below
		// so add some data to the array, and everything works!!!!!!
		
		// check if first interval contains data, if not find first in interval and use first entry as value...

		var firstInterval = Object.keys(coords)[0];
		if (firstInterval != '0') {
			// first index doesn't contain data.
			coords[0] = [];
			coords[0].push(coords[firstInterval[0]][1]);
		}
		
		for(var i = 0; i < (hours / barhours); i++) {
			if (!coords[i]) {
				coords[i] = [];
				coords[i].push(coords[i-1][coords[i-1].length-1])
			}
		}			

    //this.coords = this._calcPoints(coords);
		this.coords = coords;
    this.min = Math.min(...this.coords.map(item => Math.min(...item.map(item2 => (item2.state)))));
    this.max = Math.max(...this.coords.map(item => Math.max(...item.map(item2 => (item2.state)))));

		var theData = [];
		theData = [];
//		theData = coords.map(item => item.reduce((ave, current, index, arr) => ave + current.state));
		theData = coords.map(item => getAvg(item, 'state'));
		
		// now push data into object...
		if (entity.type == 'bar') {
			this.tools[entity.idx].tool.series = [...theData];
		}

		// now push data into object...
		if (entity.type == 'hbars') {
			this.hbars[entity.idx].data = [...theData];
		}

		if (entity.type == "vbars") {
			this.vbars[entity.idx].data = [...theData];
		}

		// 2019.10.10
		// deze eruit om de tweede render binnen 16msec te achterhalen. Is dat deze soms??
		this.requestUpdate();

  }

  getCardSize() {
    return (4);
  }
}

customElements.define('dev-swiss-army-knife-card', devSwissArmyKnifeCard);
