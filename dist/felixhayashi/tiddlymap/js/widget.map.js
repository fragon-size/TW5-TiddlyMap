/*\

title: $:/plugins/felixhayashi/tiddlymap/js/widget/MapWidget
type: application/javascript
module-type: widget

@preserve

\*/
"use strict";exports.tiddlymap=MapWidget;exports.tmap=MapWidget;var utils=require("$:/plugins/felixhayashi/tiddlymap/js/utils");var DialogManager=require("$:/plugins/felixhayashi/tiddlymap/js/DialogManager");var CallbackManager=require("$:/plugins/felixhayashi/tiddlymap/js/CallbackManager");var ViewAbstraction=require("$:/plugins/felixhayashi/tiddlymap/js/ViewAbstraction");var EdgeType=require("$:/plugins/felixhayashi/tiddlymap/js/EdgeType");var NodeType=require("$:/plugins/felixhayashi/tiddlymap/js/NodeType");var Popup=require("$:/plugins/felixhayashi/tiddlymap/js/Popup");var vis=require("$:/plugins/felixhayashi/vis/vis.js");var Widget=require("$:/core/modules/widgets/widget.js").widget;function MapWidget(e,t){Widget.call(this,e,t);this.getAttr=this.getAttribute;this.isDebug=utils.isTrue($tm.config.sys.debug,false);utils.bind(this,["constructTooltip","handleResizeEvent","handleClickEvent","handleCanvasKeyup","handleCanvasKeydown","handleCanvasScroll","handleWidgetKeyup","handleWidgetKeydown","handleTriggeredRefresh","handleContextMenu"]);this.callbackManager=new CallbackManager;this.dialogManager=new DialogManager(this.callbackManager,this);this.computeAttributes();this.editorMode=this.getAttr("editor");this.clickToUse=utils.isTrue(this.getAttr("click-to-use"),false);this.id=this.getAttr("object-id")||this.getStateQualifier();this.widgetTempStatePath=$tm.path.tempStates+"/"+this.id;this.widgetPopupsPath=$tm.path.tempPopups+"/"+this.id;if(this.editorMode){utils.addTWlisteners({"tmap:tm-create-view":this.handleCreateView,"tmap:tm-rename-view":this.handleRenameView,"tmap:tm-delete-view":this.handleDeleteView,"tmap:tm-delete-element":this.handleDeleteElement,"tmap:tm-edit-view":this.handleEditView,"tmap:tm-store-position":this.handleStorePositions,"tmap:tm-generate-widget":this.handleGenerateWidget,"tmap:tm-toggle-central-topic":this.handleSetCentralTopic,"tmap:tm-save-canvas":this.handleSaveCanvas},this,this)}utils.addTWlisteners({"tmap:tm-focus-node":this.handleFocusNode,"tmap:tm-reset-focus":this.repaintGraph},this,this);this.visListeners={click:this.handleVisSingleClickEvent,doubleClick:this.handleVisDoubleClickEvent,stabilized:this.handleVisStabilizedEvent,selectNode:this.handleVisSelectNode,deselectNode:this.handleVisDeselectNode,dragStart:this.handleVisDragStart,dragEnd:this.handleVisDragEnd,hoverNode:this.handleVisHoverElement,hoverEdge:this.handleVisHoverElement,blurNode:this.handleVisBlurElement,blurEdge:this.handleVisBlurElement,beforeDrawing:this.handleVisBeforeDrawing,stabilizationProgress:this.handleVisLoading,stabilizationIterationsDone:this.handleVisLoadingDone};this.windowDomListeners={resize:[this.handleResizeEvent,false],click:[this.handleClickEvent,false]};this.canvasDomListeners={keyup:[this.handleCanvasKeyup,true],keydown:[this.handleCanvasKeydown,true],mousewheel:[this.handleCanvasScroll,true],contextmenu:[this.handleContextMenu,true]};this.widgetDomListeners={keyup:[this.handleWidgetKeyup,true],keydown:[this.handleWidgetKeydown,true]}}MapWidget.prototype=Object.create(Widget.prototype);MapWidget.prototype.handleConnectionEvent=function(e,t){var i=this.view.getEdgeTypeFilter();var s={fromLabel:$tm.adapter.selectNodeById(e.from).label,toLabel:$tm.adapter.selectNodeById(e.to).label,viewNS:this.view.getConfig("edge_type_namespace"),eTyFilter:i.raw};var a="getEdgeType";this.dialogManager.open(a,s,function(s,a){if(s){var r=utils.getText(a);var o={namespace:this.view.getConfig("edge_type_namespace")};var r=new EdgeType(r,null,o);if(!r.exists())r.save();e.type=r.id;$tm.adapter.insertEdge(e);if(!this.view.isEdgeTypeVisible(r.id)){var n={type:r.id,view:this.view.getLabel(),eTyFilter:i.pretty};this.dialogManager.open("edgeNotVisible",n)}this.preventFitAfterRebuild=true}if(typeof t==="function"){t(s)}})};MapWidget.prototype.checkForFreshInstall=function(){var e=$tm.ref.sysMeta;if(!utils.getEntry(e,"showWelcomeMessage",true))return;utils.setEntry(e,"showWelcomeMessage",false);var t={};var i="welcome";this.dialogManager.open(i,t,function(e,t){if(utils.tiddlerExists("$:/plugins/felixhayashi/topstoryview")){utils.setText("$:/view","top");utils.setText("$:/config/Navigation/openLinkFromInsideRiver","above");utils.setText("$:/config/Navigation/openLinkFromOutsideRiver","top");utils.setText("$:/themes/tiddlywiki/vanilla/options/sidebarlayout","fixed-fluid");utils.touch("$:/plugins/felixhayashi/topstoryview")}var i=$tm.misc.defaultViewLabel;var s={label:"Have fun with",x:0,y:0};var a=$tm.adapter.insertNode(s,i);var s={label:"TiddlyMap!!",x:100,y:100};var r=$tm.adapter.insertNode(s,i);$tm.adapter.insertEdge({from:a.id,to:r.id})})};MapWidget.prototype.openStandardConfirmDialog=function(e,t){var i={message:t};this.dialogManager.open("getConfirmation",i,e)};MapWidget.prototype.logger=function(e,t){if(this.isDebug){var i=Array.prototype.slice.call(arguments,1);i.unshift("@"+this.id);i.unshift(e);$tm.logger.apply(this,i)}};MapWidget.prototype.render=function(e,t){this.parentDomNode=e;this.domNode=this.document.createElement("div");e.insertBefore(this.domNode,t);this.registerClassNames(this.domNode);this.viewHolderRef=this.getViewHolderRef();this.view=this.getView();this.graphBarDomNode=this.document.createElement("div");$tw.utils.addClass(this.graphBarDomNode,"tmap-topbar");this.domNode.appendChild(this.graphBarDomNode);this.graphDomNode=this.document.createElement("div");this.domNode.appendChild(this.graphDomNode);$tw.utils.addClass(this.graphDomNode,"tmap-vis-graph");if(utils.isPreviewed(this)||this.domNode.isTiddlyWikiFakeDom){$tw.utils.addClass(this.domNode,"tmap-static-mode");this.renderPreview(this.graphBarDomNode,this.graphDomNode)}else{this.renderFullWidget(this.domNode,this.graphBarDomNode,this.graphDomNode)}};MapWidget.prototype.renderPreview=function(e,t){var i=this.view.getRoot()+"/snapshot";var s=utils.getTiddler(i);var a=this.document.createElement("span");a.innerHTML=this.view.getLabel();a.className="tmap-view-label";e.appendChild(a);if(s){var r=this.makeChildWidget(utils.getTranscludeNode(i),true);r.renderChildren(t,null)}else{$tw.utils.addClass(t,"tmap-graph-placeholder")}};MapWidget.prototype.renderFullWidget=function(e,t,i){utils.setDomListeners("add",window,this.windowDomListeners);utils.setDomListeners("add",e,this.widgetDomListeners);this.addLoadingBar(this.domNode);this.tooltip=new Popup(this.domNode,{className:"tmap-tooltip",showDelay:$tm.config.sys.popups.delay});this.contextMenu=new Popup(this.domNode,{className:"tmap-context-menu",showDelay:0,hideOnClick:true,leavingDelay:999999});this.sidebar=utils.getFirstElementByClassName("tc-sidebar-scrollable");this.isInSidebar=this.sidebar&&!this.domNode.isTiddlyWikiFakeDom&&this.sidebar.contains(this.domNode);this.doFitAfterStabilize=true;this.preventFitAfterRebuild=false;this.initAndRenderEditorBar(t);this.initAndRenderGraph(i);$tm.registry.push(this);this.reloadRefreshTriggers();this.checkForFreshInstall();if(this.id===$tm.misc.mainEditorId){var s=$tm.url;if(s&&s.query["tmap-enlarged"]){this.toggleEnlargedMode(s.query["tmap-enlarged"])}}};MapWidget.prototype.registerClassNames=function(e){var t=$tw.utils.addClass;t(e,"tmap-widget");if(this.clickToUse){t(e,"tmap-click-to-use")}if(this.getAttr("editor")==="advanced"){t(e,"tmap-advanced-editor")}if(this.getAttr("design")==="plain"){t(e,"tmap-plain-design")}if(!utils.isTrue(this.getAttr("show-buttons"),true)){t(e,"tmap-no-buttons")}if(this.getAttr("class")){t(e,this.getAttr("class"))}};MapWidget.prototype.addLoadingBar=function(e){this.graphLoadingBarDomNode=this.document.createElement("progress");$tw.utils.addClass(this.graphLoadingBarDomNode,"tmap-loading-bar");e.appendChild(this.graphLoadingBarDomNode)};MapWidget.prototype.initAndRenderEditorBar=function(e){this.rebuildEditorBar()};MapWidget.prototype.rebuildEditorBar=function(){var e=this.view;var t={widgetQualifier:this.getStateQualifier(),widgetTempPath:this.widgetTempPath,widgetPopupsPath:this.widgetPopupsPath,isViewBound:String(this.isViewBound()),viewRoot:e.getRoot(),viewLabel:e.getLabel(),viewHolder:this.getViewHolderRef(),edgeTypeFilter:e.getPaths().edgeTypeFilter,allEdgesFilter:$tm.selector.allEdgeTypes,neighScopeBtnClass:"tmap-neigh-scope-button"+(e.isEnabled("neighbourhood_scope")?" "+"tmap-active-button":"")};for(var i in t){this.setVariable(i,t[i])}var s=utils.getTiddlerNode(e.getRoot());if(this.editorMode==="advanced"){s.children.push(utils.getTranscludeNode($tm.ref.graphBar))}else{var a=utils.getElementNode("span",e.getLabel(),"tmap-view-label");s.children.push(a)}s.children.push(utils.getTranscludeNode($tm.ref.focusButton));this.makeChildWidgets([s]);this.renderChildren(this.graphBarDomNode,this.graphBarDomNode.firstChild)};MapWidget.prototype.refresh=function(e){return false};MapWidget.prototype.update=function(e){if(!this.network||this.isZombieWidget()||utils.isPreviewed(this)){return}var t=e.changedTiddlers;var i=false;var s=false;var a=false;var r={};this.callbackManager.handleChanges(t);if(this.isViewSwitched(t)||this.hasChangedAttributes()||e[$tm.path.options]||e[$tm.path.nodeTypes]||t[this.view.getRoot()]){this.logger("warn","View switched (or main config change)");this.view=this.getView(true);this.reloadRefreshTriggers();i=true;a=true}else{var o=this.view.update(e);if(o&&!this.ignoreNextViewModification){this.logger("warn","View components modified");this.reloadBackgroundImage();i=true;s=true;r.resetEdgeTypeWL=true;if(!this.preventFitAfterRebuild){r.resetFocus={delay:0,duration:0}}}else{if(e[$tm.path.nodeTypes]){s=true}else if(this.hasChangedElements(t)){s=true}}}if(a){this.initAndRenderGraph(this.graphDomNode);this.hidePopups(0,true)}else if(s){this.rebuildGraph(r);this.hidePopups(0,true)}if(i){this.removeChildDomNodes();this.rebuildEditorBar()}else{this.refreshChildren(t)}this.ignoreNextViewModification=false};MapWidget.prototype.hidePopups=function(e,t){this.tooltip.hide(e,t);this.contextMenu.hide(0,true)};MapWidget.prototype.reloadRefreshTriggers=function(){this.callbackManager.remove(this.refreshTriggers);var e=this.getAttr("refresh-triggers")||this.view.getConfig("refresh-triggers");this.refreshTriggers=$tw.utils.parseStringArray(e)||[];this.logger("debug","Registering refresh trigger",this.refreshTriggers);for(var t=this.refreshTriggers.length;t--;){this.callbackManager.add(this.refreshTriggers[t],this.handleTriggeredRefresh,false)}};MapWidget.prototype.rebuildGraph=function(e){if(utils.isPreviewed(this))return;this.logger("debug","Rebuilding graph");e=e||{};this.hasNetworkStabilized=false;if(e.resetData){this.graphData.edges.clear();this.graphData.nodes.clear();this.graphData.edgesById=null;this.graphData.nodesById=null}if(!this.view.isEnabled("physics_mode")){var t=this.visOptions.physics;t[t.solver].centralGravity=.015}if(!e.resetFocus){this.doFitAfterStabilize=false}this.rebuildGraphData();if(!utils.hasElements(this.graphData.nodesById)){return}this.network.stabilize();if(e.resetFocus&&!this.preventFitAfterRebuild){this.doFitAfterStabilize=true;this.fitGraph(e.resetFocus.delay,e.resetFocus.duration)}this.preventFitAfterRebuild=false};MapWidget.prototype.getContainer=function(){return this.domNode};MapWidget.prototype.rebuildGraphData=function(e){$tm.start("Reloading Network");e=e||{};var t=$tm.adapter.getGraph({view:this.view});var i=t.nodes;var s=t.edges;this.graphData.nodes=this.getRefreshedDataSet(i,this.graphData.nodesById,this.graphData.nodes);this.graphData.edges=this.getRefreshedDataSet(s,this.graphData.edgesById,this.graphData.edges);this.graphData.nodesById=i;this.graphData.edgesById=s;utils.setField("$:/temp/tmap/nodes/"+this.view.getLabel(),"list",$tm.adapter.getTiddlersById(i));$tm.stop("Reloading Network");return this.graphData};MapWidget.prototype.isViewBound=function(){return utils.startsWith(this.getViewHolderRef(),$tm.path.localHolders)};MapWidget.prototype.isViewSwitched=function(e){return e[this.getViewHolderRef()]};MapWidget.prototype.hasChangedAttributes=function(){return Object.keys(this.computeAttributes()).length};MapWidget.prototype.hasChangedElements=function(e){var t=[];var i=this.graphData.nodesById;var s=this.view.isEnabled("neighbourhood_scope");var a=this.view.getEdgeTypeFilter("whitelist");for(var r in e){if(utils.isSystemOrDraft(r))continue;if(i[$tm.adapter.getId(r)]||s){return true}if(e[r].modified){t.push(r)}}if(t.length){var o=this.view.getNodeFilter("compiled");var n=utils.getMatches(o,t);return!!n.length}};MapWidget.prototype.initAndRenderGraph=function(e){if(this.network)this._destructVis();this.logger("info","Initializing and rendering the graph");if(!this.isInSidebar){this.callbackManager.add("$:/state/sidebar",this.handleResizeEvent)}this.visOptions=this.getVisOptions();this.graphData={nodes:new vis.DataSet,edges:new vis.DataSet,nodesById:utils.makeHashMap(),edgesById:utils.makeHashMap()};this.tooltip.setEnabled(utils.isTrue($tm.config.sys.popups.enabled,true));this.network=new vis.Network(e,this.graphData,this.visOptions);this.canvas=e.getElementsByTagName("canvas")[0];this.canvas.tabIndex=0;for(var t in this.visListeners){this.network.on(t,this.visListeners[t].bind(this))}this.addGraphButtons({"fullscreen-button":function(){this.toggleEnlargedMode("fullscreen")},"halfscreen-button":function(){this.toggleEnlargedMode("halfscreen")}});utils.setDomListeners("add",this.canvas,this.canvasDomListeners);this.reloadBackgroundImage();this.rebuildGraph({resetFocus:{delay:0,duration:0}});this.handleResizeEvent();this.canvas.focus()};MapWidget.prototype.handleCanvasKeyup=function(){var e={from:null,to:null};return function(t){var i=this.network.getSelectedNodes();if(t.ctrlKey){t.preventDefault();if(t.keyCode===88){if(this.editorMode){this.handleAddNodesToClipboard("move")}else{$tm.notify("Map is read only!")}}else if(t.keyCode===67){this.handleAddNodesToClipboard("copy")}else if(t.keyCode===86){this.handlePasteNodesFromClipboard()}else if(t.keyCode===65){var s=Object.keys(this.graphData.nodesById);this.network.selectNodes(s)}else if(t.keyCode===49||t.keyCode===50){if(i.length!==1)return;var a=t.keyCode===49?"from":"to";$tm.notify(utils.ucFirst(a)+"-part selected");e[a]=i[0];if(e.from&&e.to){this.handleConnectionEvent(e,function(){e={from:null,to:null}})}}}else if(t.keyCode===13){if(i.length!==1)return;this.openTiddlerWithId(i[0])}}}();MapWidget.prototype.handleDeleteElement=function(e){var t=e.paramObject.id;var i=t?[t]:this.network.getSelectedNodes();this.handleRemoveElements({nodes:i})};MapWidget.prototype.handleConfigureElement=function(e){};MapWidget.prototype.handleCanvasKeydown=function(e){if(e.keyCode===46){e.preventDefault();this.handleRemoveElements(this.network.getSelection())}};MapWidget.prototype.handleCanvasScroll=function(e){var t=!!(e.ctrlKey||this.isInSidebar||this.enlargedMode);if(t){e.preventDefault()}if(t!==this.visOptions.interaction.zoomView){e.preventDefault();e.stopPropagation();this.visOptions.interaction.zoomView=t;this.network.setOptions({interaction:{zoomView:t}});return false}};MapWidget.prototype.handleContextMenu=function(e){e.preventDefault();this.tooltip.hide(0,true);var t=this.network.getNodeAt({x:e.offsetX,y:e.offsetY});if(!t)return;var i=this.network.getSelectedNodes();if(!utils.inArray(t,i)){i=[t];this.network.selectNodes(i)}this.contextMenu.show(i,function(e,t){var i=e.length>1?"multi":"single";var s="$:/plugins/felixhayashi/tiddlymap/editor/contextMenu/node";utils.registerTransclude(this,"contextMenuWidget",s);this.contextMenuWidget.setVariable("mode",i);this.contextMenuWidget.render(t)}.bind(this))};MapWidget.prototype.handleWidgetKeyup=function(e){};MapWidget.prototype.handleWidgetKeydown=function(e){if(e.ctrlKey){e.preventDefault();if(e.keyCode===70){e.preventDefault();var t=this.widgetPopupsPath+"/focus";utils.setText(t,utils.getText(t)?"":"1")}else{return}}else if(e.keyCode===120){e.preventDefault();this.toggleEnlargedMode("halfscreen")}else if(e.keyCode===121){e.preventDefault();this.toggleEnlargedMode("fullscreen")}else if(e.keyCode===27){e.preventDefault();utils.deleteByPrefix(this.widgetPopupsPath)}else{return}this.canvas.focus()};MapWidget.prototype.handlePasteNodesFromClipboard=function(){if(!this.editorMode||this.view.isLiveView()){$tm.notify("Map is read only!");return}if($tm.clipBoard){if($tm.clipBoard.type==="nodes"){var e=$tm.clipBoard.nodes;var t=Object.keys(e);if(t.length){for(var i in e){if(this.graphData.nodesById[i])continue;this.view.addNode(e[i]);this.graphData.nodes.update({id:i})}this.network.selectNodes(t);$tm.notify("pasted "+t.length+" nodes into map.")}return}}$tm.notify("TiddlyMap clipboad is empty!")};MapWidget.prototype.handleAddNodesToClipboard=function(e){var t=this.network.getSelectedNodes();if(!t.length)return;$tm.clipBoard={type:"nodes",nodes:this.graphData.nodes.get(t,{returnType:"Object"})};$tm.notify("Copied "+t.length+" nodes to clipboard");if(e==="move"){for(var i=t.length;i--;){this.view.removeNode(t[i])}}};MapWidget.prototype.isMobileMode=function(){var e=utils.getText($tm.ref.sidebarBreakpoint,960);return window.innerWidth<=parseInt(e)};MapWidget.prototype.getVisOptions=function(){var e=$tm.config.vis;var t=utils.parseJSON(this.view.getConfig("vis"));var i=utils.merge({},e,t);i.clickToUse=this.clickToUse;i.manipulation.enabled=!!this.editorMode;i.manipulation.deleteNode=function(e,t){this.handleRemoveElements(e);this.resetVisManipulationBar(t)}.bind(this);i.manipulation.deleteEdge=function(e,t){this.handleRemoveElements(e);this.resetVisManipulationBar(t)}.bind(this);i.manipulation.addEdge=function(e,t){this.handleConnectionEvent(e);this.resetVisManipulationBar(t)}.bind(this);i.manipulation.addNode=function(e,t){this.handleInsertNode(e);this.resetVisManipulationBar(t)}.bind(this);i.manipulation.editNode=function(e,t){this.handleEditNode(e);this.resetVisManipulationBar(t)}.bind(this);i.interaction.zoomView=!!(this.isInSidebar||this.enlargedMode);i.manipulation.editEdge=false;var s=i.physics;s[s.solver]=s[s.solver]||{};s.stabilization.iterations=1e3;this.logger("debug","Loaded graph options",i);return i};MapWidget.prototype.resetVisManipulationBar=function(e){if(e)e(null);this.network.disableEditMode();this.network.enableEditMode()};MapWidget.prototype.isVisInEditMode=function(){var e="vis-button vis-back";return this.graphDomNode.getElementsByClassName(e).length>0};MapWidget.prototype.handleCreateView=function(){var e={view:this.view.getLabel()};var t="createView";this.dialogManager.open(t,e,function(e,t){if(!e)return;var i=utils.getField(t,"name");var s=utils.getField(t,"clone",false);var a=new ViewAbstraction(i);if(a.exists()){$tm.notify("Forbidden! View already exists!");return}if(s&&this.view.isLiveView()){$tm.notify("Forbidden to clone the live view!");return}a=new ViewAbstraction(i,{isCreate:true,protoView:s?this.view:null});this.setView(a)})};MapWidget.prototype.handleRenameView=function(){if(this.view.isLocked()){$tm.notify("Forbidden!");return}var e=this.view.getOccurrences();var t={count:e.length.toString(),filter:utils.joinAndWrap(e,"[[","]]")};var i="renameView";this.dialogManager.open(i,t,function(e,t){if(e){var i=utils.getText(t);var s=new ViewAbstraction(i);if(!i){$tm.notify("Invalid name!")}else if(s.exists()){$tm.notify("Forbidden! View already exists!")}else{this.view.rename(i);this.setView(this.view)}}})};MapWidget.prototype.handleEditView=function(){var e=JSON.stringify($tm.config.vis);var t=this.graphData;var i=this.view.getConfig();var s={"filter.prettyNodeFltr":this.view.getNodeFilter("pretty"),"filter.prettyEdgeFltr":this.view.getEdgeTypeFilter("pretty"),"vis-inherited":e};var a={view:this.view.getLabel(),createdOn:this.view.getCreationDate(true),numberOfNodes:Object.keys(t.nodesById).length.toString(),numberOfEdges:Object.keys(t.edgesById).length.toString(),dialog:{preselects:$tw.utils.extend({},i,s)}};var r="configureView";this.dialogManager.open(r,a,function(e,t){if(!e)return;var i=utils.getPropertiesByPrefix(t.fields,"config.",true);var s=this.view.getConfig("background_image");this.view.setConfig(i);if(i["physics_mode"]&&!this.view.isEnabled("physics_mode")){this.handleStorePositions()}var a=this.view.getConfig("background_image");if(a&&a!==s){$tm.notify("Background changed! You may need to zoom out a bit.")}var r=utils.getField(t,"filter.prettyNodeFltr","");var o=utils.getField(t,"filter.prettyEdgeFltr","");this.view.setNodeFilter(r);this.view.setEdgeTypeFilter(o)})};MapWidget.prototype.handleSaveCanvas=function(){var e="$:/temp/tmap/snapshot";var t=this.createAndSaveSnapshot(e);var i=utils.getSnapshotTitle(this.view.getLabel(),"png");var s={dialog:{snapshot:e,width:this.canvas.width.toString(),height:this.canvas.height.toString(),preselects:{name:i,action:"download"}}};var a="saveCanvas";this.dialogManager.open(a,s,function(t,s){if(!t)return;i=s.fields.name||i;var a=s.fields.action;if(a==="download"){this.handleDownloadSnapshot(i)}else if(a==="wiki"){utils.cp(e,i,true);this.dispatchEvent({type:"tm-navigate",navigateTo:i})}else if(a==="placeholder"){this.view.addPlaceholder(e)}$tw.wiki.deleteTiddler("$:/temp/tmap/snapshot")})};MapWidget.prototype.handleDownloadSnapshot=function(e){var t=this.document.createElement("a");var i=this.view.getLabel();t.download=e||utils.getSnapshotTitle(i,"png");t.href=this.getSnapshot();var s=new MouseEvent("click");t.dispatchEvent(s)};MapWidget.prototype.createAndSaveSnapshot=function(e){var t=this.view.getLabel();var i=e||this.view.getRoot()+"/snapshot";$tw.wiki.addTiddler(new $tw.Tiddler({title:i,type:"image/png",text:this.getSnapshot(true),modified:new Date}));return i};MapWidget.prototype.getSnapshot=function(e){var t=this.canvas.toDataURL("image/png");return e?utils.getWithoutPrefix(t,"data:image/png;base64,"):t};MapWidget.prototype.handleDeleteView=function(){var e=this.view.getLabel();if(this.view.isLocked()){$tm.notify("Forbidden!");return}var t=this.view.getOccurrences();if(t.length){var i={count:t.length.toString(),filter:utils.joinAndWrap(t,"[[","]]")};this.dialogManager.open("cannotDeleteViewDialog",i);return}var s="You are about to delete the view "+"''"+e+"'' (no tiddler currently references this view).";this.openStandardConfirmDialog(function(t){if(t){this.view.destroy();this.setView($tm.misc.defaultViewLabel);this.logger("debug",'view "'+e+'" deleted ');$tm.notify('view "'+e+'" deleted ')}},s)};MapWidget.prototype.handleTriggeredRefresh=function(e){this.logger("log",e,"Triggered a refresh");if(this.id==="live_tab"){var t=utils.getTiddler(utils.getText(e));if(t){var i=t.fields["tmap.open-view"]||$tm.config.sys.liveTab.fallbackView;if(i&&i!==this.view.getLabel()){this.setView(i);return}}}this.rebuildGraph({resetFocus:{delay:1e3,duration:1e3}})};MapWidget.prototype.handleRemoveElements=function(e){if(e.nodes.length){this.handleRemoveNodes(e.nodes)}else if(e.edges.length){this.handleRemoveEdges(e.edges)}this.resetVisManipulationBar()};MapWidget.prototype.handleRemoveEdges=function(e){$tm.adapter.deleteEdges(this.graphData.edges.get(e));$tm.notify("edge"+(e.length>1?"s":"")+" removed");this.preventFitAfterRebuild=true};MapWidget.prototype.handleRemoveNodes=function(e){var t=$tm.adapter.getTiddlersById(e);var i={count:e.length.toString(),tiddlers:$tw.utils.stringifyList(t),dialog:{preselects:{"delete-from":"filter"}}};var s="deleteNodeDialog";this.dialogManager.open(s,i,function(t,i){if(!t)return;if(i.fields["delete-from"]==="system"){$tm.adapter.deleteNodes(e);var s=e.length}else{var s=0;for(var a=e.length;a--;){var r=this.view.removeNode(e[a]);if(r)s++}}this.preventFitAfterRebuild=true;$tm.notify("Removed "+s+" of "+e.length+" from "+i.fields["delete-from"])})};MapWidget.prototype.toggleEnlargedMode=function(e){if(!this.isInSidebar&&e==="halfscreen")return;this.logger("log","Toggled graph enlargement");var t=this.enlargedMode;if(t){this.network.setOptions({clickToUse:this.clickToUse});utils.findAndRemoveClassNames(["tmap-has-"+t+"-widget","tmap-"+t]);this.enlargedMode=null;document.body.scrollTop=this.scrollTop}if(!t||t!==e&&(e==="fullscreen"||e==="halfscreen"&&!this.isInSidebar)){var i=document.documentElement;this.scrollTop=document.body.scrollTop;this.enlargedMode=e;var s=this.isInSidebar?this.sidebar:utils.getFirstElementByClassName("tc-story-river");$tw.utils.addClass(this.document.body,"tmap-has-"+e+"-widget");$tw.utils.addClass(s,"tmap-has-"+e+"-widget");$tw.utils.addClass(this.domNode,"tmap-"+e);this.network.setOptions({clickToUse:false});$tm.notify("Toggled "+e+" mode")}this.handleResizeEvent()};MapWidget.prototype.handleGenerateWidget=function(e){$tw.rootWidget.dispatchEvent({type:"tmap:tm-generate-widget",paramObject:{view:this.view.getLabel()}})};MapWidget.prototype.handleSetCentralTopic=function(e){var t=e.paramObject.id||this.network.getSelectedNodes()[0];if(t===this.view.getConfig("central-topic")){t=""}this.view.setCentralTopic(t)};MapWidget.prototype.handleStorePositions=function(e){var t=this.view.getNodeData();var i=this.network.getPositions();for(var s in i){t[s]=t[s]||{};t[s].x=i[s].x;t[s].y=i[s].y}this.view.saveNodeData(t);this.ignoreNextViewModification=true;if(e){$tm.notify("positions stored")}};MapWidget.prototype.handleVisStabilizedEvent=function(e){if(this.hasNetworkStabilized)return;this.hasNetworkStabilized=true;this.logger("log","Network stabilized after",e.iterations,"iterations");if(!this.view.isEnabled("physics_mode")){var t=this.graphData.nodesById;var i=[];for(var s in t){if(!t[s].x){i.push(s)}}if(i.length){this.setNodesMoveable(i,false);$tm.notify(i.length+" nodes were added to the graph");this.doFitAfterStabilize=true}var a=this.visOptions.physics;a[a.solver].centralGravity=0;this.network.setOptions(this.visOptions)}if(this.doFitAfterStabilize){this.doFitAfterStabilize=false;this.fitGraph(1e3,1e3)}};MapWidget.prototype.handleFocusNode=function(e){this.network.focus($tm.adapter.getId(e.param),{scale:1.5,animation:true})};MapWidget.prototype.isZombieWidget=function(){if(this.domNode.isTiddlyWikiFakeDom===true){return true}else{return!this.document.body.contains(this.getContainer())}};MapWidget.prototype.fitGraph=function(e,t){window.clearTimeout(this.activeFitTimeout);t=t||0;e=e||0;var i=function(){if(this.isZombieWidget())return;this.network.redraw();this.network.fit({animation:{duration:t,easingFunction:"easeOutQuart"}})};this.activeFitTimeout=window.setTimeout(i.bind(this),e)};MapWidget.prototype.handleInsertNode=function(e){var t="addNodeToMap";this.dialogManager.open(t,null,function(t,i){if(!t)return;var s=utils.getField(i,"draft.title");if(utils.tiddlerExists(s)){if(utils.isMatch(s,this.view.getNodeFilter("compiled"))){$tm.notify("Node already exists");return}else{e=$tm.adapter.makeNode(s,e);this.view.addNode(e)}}else{var a=new $tw.Tiddler(i,{"draft.title":null});e.label=s;$tm.adapter.insertNode(e,this.view,a)}this.preventFitAfterRebuild=true})};MapWidget.prototype.handleEditNode=function(e){var t=$tm.indeces.tById[e.id];var i=utils.getTiddler(t);var s=JSON.stringify($tm.config.vis);var a=this.view.getConfig("vis");var r={};r[e.id]=e;var o=$tm.adapter.getInheritedNodeStyles(r);var n=JSON.stringify(o[t]);var d=JSON.stringify(utils.merge({},{color:i.fields["color"]},utils.parseJSON(i.fields["tmap.style"])));var l=this.view.getLabel();var h={id:e.id};var g=this.view.getNodeData(e.id,true)||{};delete g.x;delete g.y;var p={view:l,tiddler:i.fields.title,tidColor:i.fields["color"],tidIcon:i.fields[$tm.field.nodeIcon]||i.fields["tmap.fa-icon"],tidLabelField:"global."+$tm.field.nodeLabel,tidIconField:"global."+$tm.field.nodeIcon,dialog:{preselects:{"inherited-global-default-style":s,"inherited-local-default-style":a,"inherited-group-styles":n,"global.tmap.style":d,"local-node-style":JSON.stringify(g)}}};var u=function(e,t,i){for(var s=i.length;s--;){p.dialog.preselects[e+"."+i[s]]=t[i[s]]||""}};u("local",g,["label","tw-icon","fa-icon","open-view"]);u("global",i.fields,[$tm.field.nodeLabel,$tm.field.nodeIcon,"tmap.fa-icon","tmap.open-view"]);this.dialogManager.open("editNode",p,function(i,s){if(!i)return;var a=s.fields;var r=utils.getPropertiesByPrefix(a,"global.",true);for(var o in r){utils.setField(t,o,r[o]||undefined)}var n=utils.getPropertiesByPrefix(a,"local.",true);var d=utils.parseJSON(a["local-node-style"],{});for(var o in n){d[o]=n[o]||undefined}this.view.saveNodeStyle(e.id,d);this.preventFitAfterRebuild=true})};MapWidget.prototype.handleVisSingleClickEvent=function(e){var t=utils.isTrue($tm.config.sys.singleClickMode);if(t&&!this.editorMode){this.handleOpenMapElementEvent(e)}};MapWidget.prototype.handleVisDoubleClickEvent=function(e){if(e.nodes.length||e.edges.length){if(this.editorMode||!utils.isTrue($tm.config.sys.singleClickMode)){this.handleOpenMapElementEvent(e)}}else{if(this.editorMode){this.handleInsertNode(e.pointer.canvas)}}};MapWidget.prototype.handleOpenMapElementEvent=function(e){if(e.nodes.length){var t=this.graphData.nodesById[e.nodes[0]];if(t["open-view"]){$tm.notify("Switching view");this.setView(t["open-view"])}else{this.openTiddlerWithId(e.nodes[0])}}else if(e.edges.length){this.logger("debug","Clicked on an Edge");var i=this.graphData.edgesById[e.edges[0]].type;this.handleEditEdgeType(i)}else{return}this.hidePopups(0,true)};MapWidget.prototype.handleEditEdgeType=function(e){if(!this.editorMode)return;var t=$tm.config.sys.edgeClickBehaviour;if(t!=="manager")return;$tw.rootWidget.dispatchEvent({type:"tmap:tm-manage-edge-types",paramObject:{type:e}})};MapWidget.prototype.handleResizeEvent=function(e){if(this.isZombieWidget())return;var t=this.getAttr("height");var i=this.getAttr("width");if(this.isInSidebar){var s=this.domNode.getBoundingClientRect();var a=15;i=document.body.clientWidth-s.left-a+"px";var r=parseInt(this.getAttr("bottom-spacing"))||15;var o=window.innerHeight-s.top;t=o-r+"px"}this.domNode.style.height=t||"300px";this.domNode.style.width=i;this.repaintGraph()};MapWidget.prototype.handleClickEvent=function(e){if(this.isZombieWidget()||!this.network)return;if(!this.graphDomNode.contains(e.target)){var t=this.network.getSelection();if(t.nodes.length||t.edges.length){this.logger("debug","Clicked outside; deselecting nodes/edges");this.network.selectNodes([]);this.resetVisManipulationBar()}}else{this.canvas.focus()}this.contextMenu.hide(0,true)};MapWidget.prototype.handleVisSelectNode=function(e){this.assignActiveStyle(e.nodes)};MapWidget.prototype.assignActiveStyle=function(e){if(!Array.isArray(e))e=[e];var t=this.visOptions.nodes.color;for(var i=e.length;i--;){var s=e[i];var a=this.graphData.nodesById[s];var r=utils.merge({},t,a.color);this.graphData.nodes.update({id:s,color:{highlight:r,hover:r}})}};MapWidget.prototype.handleVisDeselectNode=function(e){};MapWidget.prototype.handleVisDragEnd=function(e){if(!e.nodes.length)return;this.setNodesMoveable(e.nodes,false)};MapWidget.prototype.handleVisBeforeDrawing=function(e){if(this.backgroundImage){e.drawImage(this.backgroundImage,0,0)}};MapWidget.prototype.constructTooltip=function(e,t){var i=utils.parseJSON(e);var s=i.node||i.edge;var a=null;var r="text/html";var o="text/vnd-tiddlywiki";if(i.node){var n=$tm.indeces.tById[s];var d=utils.getTiddler(n);var l=d.fields[$tm.field.nodeInfo];if(l){t.innerHTML=$tw.wiki.renderText(r,o,l)}else if(d.fields.text){utils.registerTransclude(this,"tooltipWidget",n);this.tooltipWidget.setVariable("tv-tiddler-preview","yes");this.tooltipWidget.render(t)}else{t.innerHTML=n}}else{var h=this.graphData.edgesById[s];var g=$tm.indeces.allETy[h.type];if(g.description){a=$tw.wiki.renderText(r,o,g.description)}t.innerHTML=a||g.label||g.id}};MapWidget.prototype.handleVisHoverElement=function(e){if($tm.mouse.buttons)return;var t=e.node||e.edge;var i=JSON.stringify(e);if(e.node){this.assignActiveStyle(t)}if(!this.isVisInEditMode()&&!this.contextMenu.isShown()){var s=this.constructTooltip;var i=JSON.stringify(e);this.tooltip.show(i,s)}};MapWidget.prototype.handleVisBlurElement=function(e){this.tooltip.hide()};MapWidget.prototype.handleVisLoading=function(e){this.graphLoadingBarDomNode.style.display="block";this.graphLoadingBarDomNode.setAttribute("max",e.total);this.graphLoadingBarDomNode.setAttribute("value",e.iterations)};MapWidget.prototype.handleVisLoadingDone=function(e){
this.graphLoadingBarDomNode.style.display="none"};MapWidget.prototype.handleVisDragStart=function(e){if(e.nodes.length){this.hidePopups(0,true);this.assignActiveStyle(e.nodes);this.setNodesMoveable(e.nodes,true)}};MapWidget.prototype.destruct=function(){utils.setDomListeners("remove",window,this.windowDomListeners);utils.setDomListeners("remove",this.domNode,this.widgetDomListeners);this._destructVis()};MapWidget.prototype._destructVis=function(){if(!this.network)return;utils.setDomListeners("remove",this.canvas,this.canvasDomListeners);this.network.destroy();this.network=null};MapWidget.prototype.openTiddlerWithId=function(e){var t=$tm.indeces.tById[e];this.logger("debug","Opening tiddler",t,"with id",e);if(this.enlargedMode==="fullscreen"){var i=this.wiki.findDraft(t);var s=!!i;if(!s){var a="tm-edit-tiddler";this.dispatchEvent({type:a,tiddlerTitle:t});i=this.wiki.findDraft(t)}var r={draftTRef:i,originalTRef:t};var o="fullscreenTiddlerEditor";this.dialogManager.open(o,r,function(e,a){if(e){var r="tm-save-tiddler";this.dispatchEvent({type:r,tiddlerTitle:i})}else if(!s){utils.deleteTiddlers([i])}var r="tm-close-tiddler";this.dispatchEvent({type:r,tiddlerTitle:t})})}else{var n=this.domNode.getBoundingClientRect();this.dispatchEvent({type:"tm-navigate",navigateTo:t,navigateFromTitle:this.getVariable("storyTiddler"),navigateFromNode:this,navigateFromClientRect:{top:n.top,left:n.left,width:n.width,right:n.right,bottom:n.bottom,height:n.height}})}};MapWidget.prototype.getViewHolderRef=function(){if(this.viewHolderRef){return this.viewHolderRef}this.logger("info","Retrieving or generating the view holder reference");var e=this.getAttr("view");if(e){this.logger("log",'User wants to bind view "'+e+'" to graph');var t=$tm.path.views+"/"+e;if(this.wiki.getTiddler(t)){var i=$tm.path.localHolders+"/"+utils.genUUID();this.logger("log",'Created an independent temporary view holder "'+i+'"');utils.setText(i,t);this.logger("log",'View "'+t+'" inserted into independend holder')}else{this.logger("log",'View "'+e+'" does not exist')}}if(typeof i==="undefined"){this.logger("log","Using default (global) view holder");var i=$tm.ref.defaultViewHolder}return i};MapWidget.prototype.setView=function(e,t){e=new ViewAbstraction(e);if(!e.exists())return;var i=e.getLabel();t=t||this.viewHolderRef;this.logger("info","Inserting view '"+i+"' into holder '"+t+"'");this.wiki.addTiddler(new $tw.Tiddler({title:t,text:i}))};MapWidget.prototype.getView=function(e){if(!e&&this.view){return this.view}var t=this.getViewHolderRef();var i=utils.getText(t);var s=new ViewAbstraction(i);this.logger("debug","Retrieved view from holder");if(!s.exists()){this.logger("debug",'Warning: View "'+i+"\" doesn't exist. Default is used instead.");s=new ViewAbstraction("Default")}return s};MapWidget.prototype.reloadBackgroundImage=function(e){this.backgroundImage=null;var t=this.view.getConfig("background_image");var i=utils.getTiddler(t);if(!i&&!t)return;var s=new Image;var a=function(e){s.src=e};s.onload=function(){this.backgroundImage=s;this.repaintGraph();if(e){$tm.notify(e)}}.bind(this);if(i){var r=i.fields["_canonical_uri"];if(r){utils.getImgFromWeb(r,a)}else if(i.fields.text){var o=$tw.utils.makeDataUri(i.fields.text,i.fields.type);s.src=o}}else if(t){utils.getImgFromWeb(t,a)}};MapWidget.prototype.getRefreshedDataSet=function(e,t,i){if(!i){return new vis.DataSet(utils.getValues(e))}if(t)i.remove(Object.keys(t));i.update(utils.getValues(e));return i};MapWidget.prototype.repaintGraph=function(){var e=$tw.utils.hasClass(this.document.body,"tmap-has-fullscreen-widget");if(this.network&&(!e||e&&this.enlargedMode)){this.logger("info","Repainting the whole graph");this.network.redraw();this.fitGraph(0,1e3)}};MapWidget.prototype.setGraphButtonEnabled=function(e,t){var i="vis-button"+" "+"tmap-"+e;var s=utils.getFirstElementByClassName(i,this.domNode);$tw.utils.toggleClass(s,"tmap-button-enabled",t)};MapWidget.prototype.dialogPostProcessor=function(){this.network.selectNodes([]);this.resetVisManipulationBar()};MapWidget.prototype.setNodesMoveable=function(e,t){if(!e||!e.length||this.view.isEnabled("physics_mode")){return}var i=[];var s=!t;for(var a=e.length;a--;){i.push({id:e[a],fixed:{x:s,y:s}})}this.graphData.nodes.update(i);if(s){this.logger("debug","Fixing",i.length,"nodes");this.handleStorePositions()}};MapWidget.prototype.addGraphButtons=function(e){var t=utils.getFirstElementByClassName("vis-navigation",this.domNode);for(var i in e){var s=this.document.createElement("div");s.className="vis-button "+" "+"tmap-"+i;s.addEventListener("click",e[i].bind(this),false);t.appendChild(s);this.setGraphButtonEnabled(i,true)}};