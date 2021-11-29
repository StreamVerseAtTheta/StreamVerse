// @ts-nocheck
import * as BABYLON from 'babylonjs';
import "babylonjs-loaders";
import {
    CharacterController
} from './CharacterController'
import {
    RemoteCharacterController
} from './RemoteCharacterController';
import {
    PBRMaterial
} from 'babylonjs/Materials/PBR/pbrMaterial';
import * as idelcv from './IdleCanvas'
import * as Voxeet  from './dolbyio/Voxeet'
import {VoxeetSDK} from './dolbyio/Voxeet'
import {
    request,
    gql
} from 'graphql-request'
import abi from './abi'

var Buffer = require('buffer').Buffer
var ieee754 = require('ieee754')

export default class MyScene {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _player: BABYLON.AbstractMesh;
    private _cc: CharacterController;
    private _playerList = {};
    private _ws = null;
    private _join_status = false;
    private _roomId = ""
    private _rcolor = {}
    private _color: BABYLON.Color3 = new BABYLON.Color3(0, 0, 0)
    private idleCanvas = null
    private idelcanvasMat = null
    private sideScreens = {}
    private _rp_audio = {}
    private _myself = ""
    private _conference = null;
    private current_team = 0;
    private eventId =null
    private _data = {}
    private displayKey = null

    constructor(canvasElement: string, roomid: string, name: string) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);
        this._roomId =  roomid;
        this._myself = name;
        this.uiKit()
        this.eventId = roomid.split("_")[0]
        this.current_team = Number(roomid.split("_")[1])
        window.watchVideo = (urlx)=>{
            let _u = urlx.split("/")
            console.log(_u)
            let vid = _u[_u.length-2]
            window.open(`https://player.thetavideoapi.com/video/${vid}`, "_blank");        
        }
    }

    async fetchEvent(){
        try{
            const query = gql `{
                events(where: { idString: "${this.eventId}"}){
                id
                idString
                url
                }
            }
            `
            let data = await request('https://thetagraph.overclockedbrains.co/subgraphs/name/Testo', query)
            if(data['events'].length>0 && data['events'][0].hasOwnProperty('url') &&  data['events'][0]['url']){
                let url = "https://" + data['events'][0]['url'] + '.ipfs.infura-ipfs.io/'
                let r = await (await fetch(url)).json()
                this.displayKey = r['key']
                delete r['key']
                delete r['event_url']
                this._data = r;
            }
        }catch(e){
            console.error('Not able to fecth event data: '+e)
        }
    }

    async fetchNfts(p){
        try{
            let px = this._data[this.current_team][`p${p}`]
            if(!px.hasOwnProperty('key') || !px['key']){
                return;
            }
            const query = gql `{
                nfts(where: { owner: ${JSON.stringify(px['key'].toLowerCase())}, forsale:true}){
                    id
                    url
                    price
                }
              }
            `               
            let data = await request('https://thetagraph.overclockedbrains.co/subgraphs/name/Testo', query)
            if(data['nfts'].length>0){
                this._data[this.current_team][`p${p}`]['nfts'] = data['nfts'];
                let s= ""
                for(let n of data['nfts']){
                    let a = `
                    <div>
                        <div style="display: flex; margin-top: 15px;align-items: center; ">
                            <img src="/icons/play.png" onclick="watchVideo('${n['url']}')" class="mic" height="64" width="64">
                            <div style="display: flex;flex-direction: column;margin-left: 15px;">
                                <div style="display: flex;">
                                    <span style=" font-family: 'niko'; font-size: large;">NFT-ID: ${n['id']}</span>
                                    <span style=" font-family: 'niko'; font-size: large; margin-left: 10px;">Price: ${Web3.utils.fromWei(n['price'], 'ether')} TFUEL</span>
                                </div>
                            <div>
                            <button onclick="buynft('${n['id']}',${n['price']})" style="font-size: 12px;padding: 2px;padding-left: 10px; padding-right: 10px;border-radius: 30px; align-self: center;border-color: #ce4848;  color: #ce4848; background-color: white;">Buy</button>
                            </div>
                      </div>
                    </div>
                    <div style="background-color: rgba(0,0,0,0.6);height: 1px;width: 100%; margin-top:10px"></div>
                  </div>`
                  s+=a
                }
                $(`#lp${p}`).html(s)
            }
        }catch(e){
            console.error('Not able to fecth nfts data: '+e)
        }
    }

    updateMenuPlayerSwitch(p){
        if(p==1){
            $(`#lp1`).show()
            $(`#lp2`).hide()
            $(`#lp3`).hide()
            $(`#lp4`).hide()
        }else if(p==2){
            $(`#lp2`).show()
            $(`#lp1`).hide()
            $(`#lp3`).hide()
            $(`#lp4`).hide()
        }else if(p==3){
            $(`#lp3`).show()
            $(`#lp1`).hide()
            $(`#lp2`).hide()
            $(`#lp4`).hide()
        }else if(p==4){
            $(`#lp4`).show()
            $(`#lp1`).hide()
            $(`#lp2`).hide()
            $(`#lp3`).hide()
        }
        let px = this._data[this.current_team][`p${p}`]
        if(!px.hasOwnProperty('name')){
            return;
        }
        $('#mpname').text(px['name'])
        $(`#nftp${p}`).children().attr('src',px['img'])
        $("#donateme").attr('p',p)
    }

    updateTeamList(){
        $("#teams").empty()
        let s=""
        for(let a in this._data){
            s += `<div style="display: flex; align-items: center; margin-top: 15px;">
                        <span style=" font-family: 'niko'; font-size: large;">${this._data[a]['team_name']}</span>
                        <div style='margin-left: 15px;'>
                           ${Number(a)==this.current_team ?'':'<button style="font-size: 12px;padding: 2px;padding-left: 10px; padding-right: 10px;border-radius: 30px; align-self: center;border-color: #ce4848;  color: #ce4848; background-color: white;">Switch</button>'} 
                        </div>
                    </div>`;
        }
        $("#teams").html(s)
    }

    updatePlayers(){
        let team = this._data[this.current_team]
        if(team['p1'].hasOwnProperty('name')){
            let p = team['p1']
            $('#broadcaster1_txt').text(p['name'])
            $('#broadcaster1').children().attr('src',p['img'])
            $('#nftp1').show()
            this.fetchNfts('1')
        }else{
            $('#broadcaster1_txt').parent().parent().hide()
            $('#nftp1').hide()
        }

        if(team['p2'].hasOwnProperty('name')){
            let p = team['p2']
            $('#broadcaster2_txt').text(p['name'])
            $('#broadcaster2').children().attr('src',p['img'])
            $('#nftp2').show()
            this.fetchNfts('2')
        }else{
            $('#broadcaster2_txt').parent().parent().hide()
            $('#nftp1').hide()
        }

        if(team['p3'].hasOwnProperty('name')){
            let p = team['p3']
            $('#broadcaster3_txt').text(p['name'])
            $('#broadcaster3').children().attr('src',p['img'])
            $('#nftp3').show()
            this.fetchNfts('3')
        }else{
            $('#broadcaster3_txt').parent().parent().hide()
            $('#nftp3').hide()
        }

        if(team['p4'].hasOwnProperty('name')){
            let p = team['p4']
            $('#broadcaster4_txt').text(p['name'])
            $('#broadcaster4').children().attr('src',p['img'])
            $('#nftp4').show()
            this.fetchNfts('4')
        }else{
            $('#broadcaster4_txt').parent().parent().hide()
            $('#nftp4').hide()
        }

        this.updateMenuPlayerSwitch(4)
        this.updateMenuPlayerSwitch(3)
        this.updateMenuPlayerSwitch(2)
        this.updateMenuPlayerSwitch(1)

        
    }

    addVideoNode = (id, stream) => {
        let videoNode = document.getElementById('video-' + id);
      
        if (!videoNode) {
          videoNode = document.createElement('video');
      
          videoNode.setAttribute('id', 'video-' + id);
          videoNode.setAttribute('height', 240);
          videoNode.setAttribute('width', 320);
          videoNode.setAttribute("playsinline", true);
          videoNode.setAttribute("autoplay", 'autoplay');
          videoNode.muted = true;
      
          const videoContainer = document.getElementById('virtual_video_screens');
          videoContainer.appendChild(videoNode);
        }
        navigator.attachMediaStream(videoNode, stream);
        
        return videoNode;
    }

    addVideoNodex = (id) =>{
        let videoNode = document.getElementById('video-' + id);
        if (!videoNode) {
          videoNode = document.createElement('video');
      
          videoNode.setAttribute('id', 'video-' + id);
          videoNode.setAttribute('class', 'video-js vjs-default-skin');
          videoNode.setAttribute('controls', '');
          videoNode.setAttribute("playsinline", true);
      
          const videoContainer = document.getElementById('virtual_video_screens');
          videoContainer.appendChild(videoNode);
        }
     
        return videoNode;
    }

    removeVideoNode = id => {
        let videoNode = document.getElementById("video-" + id)
        if (videoNode) {
            videoNode.srcObject = null; // Prevent memory leak in Chrome
            videoNode.parentNode.removeChild(videoNode)
        }
    }

    createPlayer(id, streamID){
        if(this.sideScreens.hasOwnProperty(id)){
            let screen = this.sideScreens[id]['mesh']
            let material =  this.sideScreens[id]['material']
            this.sideScreens[id]['play'] = true;
            const optionalHlsOpts = {
            };
            const optionalThetaOpts = {
              allowRangeRequests: true, // false if cdn does not support range headers  
            };

            this.addVideoNodex(`_${id}`)

            const player = videojs(`video-_${id}`, {
                techOrder: ["theta_hlsjs", "html5"],
                sources:[{
                    src: "https://theta-edgenode.herokuapp.com/stream/".concat(streamID, ".m3u8?ts=").concat( ((new Date).getTime()/1000).toFixed(0) ),
                    type: "application/x-mpegURL",
                    label: "Auto"
                }],
                theta_hlsjs: {
                    videoId: streamID,
                    userId: "user1", 
                    onThetaReady: null, // optional listener
                    onStreamReady:  ()=> {
                        setTimeout( ()=> {
                            let videoTexture  = new BABYLON.VideoTexture(`vtx_${id}`, $(`#video-_${id}`).children("video")[0], this._scene, true, false)
                            this.sideScreens[id]['videoTexture']  = videoTexture
                            material.diffuseTexture = videoTexture
                            screen.material = material;
                        }, 500)
                    },
                    hlsOpts: optionalHlsOpts,
                    thetaOpts: optionalThetaOpts,
                }
            });
            player.autoplay("any")
            this.sideScreens[id]['player'] = player;
        }
    }

    disposePlayer(id){
        if(this.sideScreens.hasOwnProperty(id) && this.sideScreens[id]['play']){
            let screen = this.sideScreens[id]['mesh']
            screen.material = this.idelcanvasMat;
            this.sideScreens[id]['play'] = false;
            let videoNode = this.addVideoNodex(`_${id}`)
            videojs(videoNode).dispose()
            this.sideScreens[id]['player'] =null;

            this.sideScreens[id]['videoTexture'].dispose()
        }
    }
    async check_metamask(){
        try{
            if (window.ethereum) {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                window.web3 = await new Web3(window.ethereum);
                return true;
            }  
            return false;
        }catch(e){
            console.log(e)
            throw("")
      
        }
    }

    uiKit(){
        $('#broadcaster1').click(()=>{
            if($('#broadcaster1').attr('isEnable')=='false'){
                $("#broadcaster1").css("background-color", "#09a842");
                $('#broadcaster1').attr('isEnable','true')
                this.createPlayer(1,this._data[this.current_team]['p1']['key'])
            }else{
                $("#broadcaster1").css("background-color", "red");
                $('#broadcaster1').attr('isEnable','false')
                this.disposePlayer(1)
            }
        })
        $('#broadcaster2').click(()=>{
            if($('#broadcaster2').attr('isEnable')=='false'){
                $("#broadcaster2").css("background-color", "#09a842");
                $('#broadcaster2').attr('isEnable','true')
                this.createPlayer(2,this._data[this.current_team]['p2']['key'])
            }else{
                $("#broadcaster2").css("background-color", "red");
                $('#broadcaster2').attr('isEnable','false')
                this.disposePlayer(2)
            }
        })
        $('#broadcaster3').click(()=>{
            if($('#broadcaster3').attr('isEnable')=='false'){
                $("#broadcaster3").css("background-color", "#09a842");
                $('#broadcaster3').attr('isEnable','true')
                this.createPlayer(3,this._data[this.current_team]['p3']['key'])
            }else{
                $("#broadcaster3").css("background-color", "red");
                $('#broadcaster3').attr('isEnable','false')
                this.disposePlayer(3)
            }
        })
        $('#broadcaster4').click(()=>{
            if($('#broadcaster4').attr('isEnable')=='false'){
                $("#broadcaster4").css("background-color", "#09a842");
                $('#broadcaster4').attr('isEnable','true')
                this.createPlayer(4,this._data[this.current_team]['p4']['key'])
            }else{
                $("#broadcaster4").css("background-color", "red");
                $('#broadcaster4').attr('isEnable','false')
                this.disposePlayer(4)
            }
        })
       
        $(`#nftp1`).click(()=>{
            $(`#nftp1`).attr('isSelected','true')
            $(`#nftp1`).css('background-color','')
            $(`#nftp2`).attr('isSelected','true')
            $(`#nftp2`).css('background-color','')
            $(`#nftp3`).attr('isSelected','true')
            $(`#nftp3`).css('background-color','')
            $(`#nftp4`).attr('isSelected','true')
            $(`#nftp4`).css('background-color','')
            $(`#nftp1`).attr('isSelected','true')
            $(`#nftp1`).css('background-color','#09a842')
 

            this.updateMenuPlayerSwitch(1)
        })
        
        $(`#nftp2`).click(()=>{
            $(`#nftp1`).attr('isSelected','true')
            $(`#nftp1`).css('background-color','')
            $(`#nftp2`).attr('isSelected','true')
            $(`#nftp2`).css('background-color','')
            $(`#nftp3`).attr('isSelected','true')
            $(`#nftp3`).css('background-color','')
            $(`#nftp4`).attr('isSelected','true')
            $(`#nftp4`).css('background-color','')
            $(`#nftp2`).attr('isSelected','true')
            $(`#nftp2`).css('background-color','#09a842')
            this.updateMenuPlayerSwitch(2)
        })
        
        $(`#nftp3`).click(()=>{
            $(`#nftp1`).attr('isSelected','true')
            $(`#nftp1`).css('background-color','')
            $(`#nftp2`).attr('isSelected','true')
            $(`#nftp2`).css('background-color','')
            $(`#nftp3`).attr('isSelected','true')
            $(`#nftp3`).css('background-color','')
            $(`#nftp4`).attr('isSelected','true')
            $(`#nftp4`).css('background-color','')
            $(`#nftp3`).attr('isSelected','true')
            $(`#nftp3`).css('background-color','#09a842')
            this.updateMenuPlayerSwitch(3)
        })
        
        $(`#nftp4`).click(()=>{
            $(`#nftp1`).attr('isSelected','true')
            $(`#nftp1`).css('background-color','')
            $(`#nftp2`).attr('isSelected','true')
            $(`#nftp2`).css('background-color','')
            $(`#nftp3`).attr('isSelected','true')
            $(`#nftp3`).css('background-color','')
            $(`#nftp4`).attr('isSelected','true')
            $(`#nftp4`).css('background-color','')
            $(`#nftp4`).attr('isSelected','true')
            $(`#nftp4`).css('background-color','#09a842')
            this.updateMenuPlayerSwitch(4)
        })

        $('#donateme').click(async ()=>{
            let p = $('#donateme').attr('p')
            
            if(p){
                let isMetmask = await this.check_metamask()
                let address = (await window.web3.eth.getAccounts())[0]
                if(isMetmask){
                    var amnt = prompt("Please enter donation amount (TFUEL)", "");
                    let px = this._data[this.current_team][`p${p}`]['key']
                    window.web3.eth.sendTransaction({from: address,value: Web3.utils.toWei(amnt, 'ether'),  to : px})
                }else{
                    notify('Please install metamask!')
                }
            }
        })
        
 
        $("#teams").hide()

        $('#menu').click(()=>{
            $("#menu_").modal("show");
        })
        $("#ms").click(() => {
            $("#ws").attr("class", "mbuttons");
            $("#ms").attr("class", "smbuttons");
            $("#players").show()
            $("#teams").hide()
            
        })
        $("#ws").click(() => {
            $("#ws").attr("class", "smbuttons");
            $("#ms").attr("class", "mbuttons");
            $("#players").hide()
            $("#teams").show()
        })

        const $popup = $('.video-popup');
        const $closeIcon = $('.close');
        $closeIcon.click(function () {
            $popup.fadeOut(200);
        });
    }


    async wsClient(callback) {
        console.log("Initialsing Websocket Connection...")
        callback(false, "Joining Room...")
        try {
            this._ws = new WebSocket('wss://oecmeta.herokuapp.com/ws');
            this._ws.binaryType = "arraybuffer";
            this._ws.onclose = async () => {
                try{
                    await VoxeetSDK.conference.leave()
                }catch(e){}
                this._ws = null;
                for (let a in this._playerList) {
                    let p: RemoteCharacterController = this._playerList[a]
                    p._avatar.dispose()
                    delete this._playerList[a]
                }
                console.log("Connection closed!")
                console.log("Retrying....")
                setTimeout(() => {
                    console.log("Retrying again after 1s delay...")
                    this.wsClient(callback)
                }, 1000)
            }

            this._ws.onerror = (e) => {
                console.log("Webscoket Error: " + e)
            }

            this._ws.onmessage = async (event) => {
                let data = event.data;
                if (typeof data == "string") {
                    data = JSON.parse(data)
                    if (data.response == "room_joined") {
                        try{
                            await Voxeet.createSession(`${this._myself}#${data.id}`)
                            let cnf = await Voxeet.createConference(this._roomId)
                            this._conference = cnf;
                            await Voxeet.joinConference(cnf)
                            Voxeet.stopAudio();
                            for( let participant of Array.from(VoxeetSDK.conference.participants, ([name, value]) => ( value ))){
                                console.log(`participant: ${participant.info.name} ${participant.id}`)
                                if(participant.id!= VoxeetSDK.session.participant.id){
                                    let _temp = participant.info.name.split("#")
                                    let id = Number(_temp[_temp.length-1])
                                    console.log(`Remote ID: ${id}`)
                                    this._rp_audio[id] = participant;
                                }
                            }
                            const forward = { x: 0, y: 0, z: 1 };
                            const up  = { x: 0, y: 1, z: 0 };
                            const right  = { x: -1, y: 0, z: 0 };
                            VoxeetSDK.conference.setSpatialEnvironment({ x: 7, y: 1, z: 7}, forward, up, right);
                        }catch(e){
                            console.error("Voxeet: createSession: "+e)
                        }
                        if (!this._join_status) {
                            VoxeetSDK.conference.on("streamAdded", (participant, stream) => {
                                try{
                                    console.log(`Stream Added: ${participant.info.name} ${participant.id}`)
                                    console.log(stream.type)
                                    if(stream.getVideoTracks().length){
                                        let targe : BABYLON.Mesh = null;
                                        if(participant.id== VoxeetSDK.session.participant.id){
                                            targe = this._player;
                                        }else{
                                            let _temp = participant.info.name.split("#")
                                            let id = Number(_temp[_temp.length-1])
                                            if(!this._playerList.hasOwnProperty(id)){
                                                return;
                                            }
                                            targe = this._playerList[id]._avatar
                                        }
                                        let vn =this.addVideoNode(participant.id, stream)
                                        let mat :BABYLON.PBRMaterial = targe.getChildMeshes()[4].material
                                        mat.albedoTexture = new BABYLON.VideoTexture(`video-${participant.id}`,vn, this._scene, true);
                                    }
                                    if(stream.getAudioTracks().length){
                                        if(participant.id!= VoxeetSDK.session.participant.id){
                                            let _temp = participant.info.name.split("#")
                                            let id = Number(_temp[_temp.length-1])
                                            console.log(`Remote ID: ${id}`)
                                            this._rp_audio[id] = participant;
                                            if(this._playerList.hasOwnProperty(id)){
                                                let p: RemoteCharacterController = this._playerList[id]
                                                let mat: BABYLON.PBRMaterial = p._avatar.getChildMeshes()[5].material 
                                                mat.emissiveColor = new BABYLON.Color3(30/255, 230/255, 60/255);
                                                VoxeetSDK.conference.setSpatialPosition(this._rp_audio[id], {x: p._avatar.position.x,y:0,z:p._avatar.position.z});                                          
                                            }
                                        }else{
                                                if(this._player){
                                                    let mat: BABYLON.PBRMaterial = this._player.getChildMeshes()[5].material 
                                                    mat.emissiveColor = new BABYLON.Color3(30/255, 230/255, 60/255);   
                                                }
                                        }
                                    }
                                }catch(e){
                                    console.error(e)
                                }
                            })

                            VoxeetSDK.conference.on('streamUpdated', (participant, stream) => {
                                console.log('streamUpdated: '+stream)
                                console.log(stream.type)
                                if(stream.getVideoTracks().length){
                                    let targe : BABYLON.Mesh = null;
                                    if(participant.id== VoxeetSDK.session.participant.id){
                                        targe = this._player;
                                    }else{
                                        let _temp = participant.info.name.split("#")
                                        let id = Number(_temp[_temp.length-1])
                                        if(!this._playerList.hasOwnProperty(id)){
                                            return;
                                        }
                                        targe = this._playerList[id]._avatar
                                    }
                                    let vn =this.addVideoNode(participant.id, stream)
                                    let mat :BABYLON.PBRMaterial = targe.getChildMeshes()[4].material
                                    mat.albedoTexture = new BABYLON.VideoTexture(`video-${participant.id}`,vn, this._scene, false);
                                }
                                if(!stream.getAudioTracks().length){
                                    if(participant.id!= VoxeetSDK.session.participant.id){
                                        let _temp = participant.info.name.split("#")
                                        let id = Number(_temp[_temp.length-1])
                                        if(this._playerList.hasOwnProperty(id)){
                                            let p: RemoteCharacterController = this._playerList[id]
                                            let mat: BABYLON.PBRMaterial = p._avatar.getChildMeshes()[5].material 
                                            mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
                                        }
                                    }else{
                                        let mat: BABYLON.PBRMaterial = this._player.getChildMeshes()[5].material 
                                        mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
                                    }
                                }else{

                                    if(participant.id!= VoxeetSDK.session.participant.id){
                                        let _temp = participant.info.name.split("#")
                                        let id = Number(_temp[_temp.length-1])
                                        console.log(`Remote ID: ${id}`)
                                        this._rp_audio[id] = participant;
                                        if(this._playerList.hasOwnProperty(id)){
                                            let p: RemoteCharacterController = this._playerList[id]
                                            let mat: BABYLON.PBRMaterial = p._avatar.getChildMeshes()[5].material 
                                            mat.emissiveColor = new BABYLON.Color3(30/255, 230/255, 60/255);
                                            VoxeetSDK.conference.setSpatialPosition(this._rp_audio[id], {x: p._avatar.position.x,y:0,z:p._avatar.position.z});                                          
                                        }
                                    }else{
                                        let mat: BABYLON.PBRMaterial = this._player.getChildMeshes()[5].material 
                                        mat.emissiveColor = new BABYLON.Color3(30/255, 230/255, 60/255);
                                    }
                                }
                            })

                            VoxeetSDK.conference.on('streamRemoved', (participant, stream) => {
                                console.log(`Stream Removed: ${participant.info.name} ${participant.id}`)
                                if(participant.id!=VoxeetSDK.session.participant.id){
                                    let _temp = participant.info.name.split("#")
                                    let id = Number(_temp[_temp.length-1])
                                    if(this._rp_audio.hasOwnProperty(id)){
                                        delete this._rp_audio[id]
                                    }
                                    if(this._playerList.hasOwnProperty(id)){
                                        let p: RemoteCharacterController = this._playerList[id]
                                        let mat: BABYLON.PBRMaterial = p._avatar.getChildMeshes()[5].material 
                                        mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
                                    }
                                }else{
                                    if(this._player){
                                        let mat: BABYLON.PBRMaterial = this._player.getChildMeshes()[5].material 
                                        mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
                                    }
                                }
                            })
                            this._scene = new BABYLON.Scene(this._engine);
                            callback(false, "Loading Character...")
                            await this.loadPlayer()
                            callback(false, "Loading Scene...")
                            await this.createScene();
                            setInterval(() => {
                                this._ws.send(JSON.stringify({
                                    action: "ping",
                                }))
                            }, 10000)
                            callback(true, "")
                            this._join_status = true;
                        
                            $("#mic").click(() => {
                                if ($("#mic").attr("src") == "icons/mmicrophone.png") {
                                    console.log("unmute")
                                    Voxeet.startAudio()
                                    $("#mic").attr("src", "icons/microphone.png");
                                } else {
                                    console.log("mute")
                                    Voxeet.stopAudio()
                                    $("#mic").attr("src", "icons/mmicrophone.png")
                                }
                            });
                                 
                            $("#videoc").click(() => {
                                if ($("#videoc").attr("src") == "icons/videooff.png") {
                                    console.log("cam on")
                                    Voxeet.startVideo()
                                    $("#videoc").attr("src", "icons/video.png");
                                } else {
                                    console.log("cam off")
                                    Voxeet.stopVideo()
                                    $("#videoc").attr("src", "icons/videooff.png")
                                }
                            });

                            $("#fpp").click(() => {
                                if ($("#fpp").attr("src") == "icons/viewoff.png") {
                                    console.log("view on")
                                    this._player.setEnabled(false)
                                    $("#fpp").attr("src", "icons/view.png");
                                } else {
                                    console.log("view off")
                                    this._player.setEnabled(true)
                                    $("#fpp").attr("src", "icons/viewoff.png")
                                }
                            });
                            
                        }
                        this._color = new BABYLON.Color3(data.rgb[0], data.rgb[1], data.rgb[2])
                        let mat: PBRMaterial = this._scene.getMaterialByName("body.001")
                        mat.albedoColor = this._color
                        console.log("Room joined sucessfully...")
                    } else if (data.response == "rgb") {
                        this._rcolor[data.id] = data.rgb
                        if (this._playerList.hasOwnProperty(data.id)) {
                            this._playerList[data.id].setColor(data.rgb)
                        }
                    }
                } else {
                    let buf = Buffer.from(data)
                    let a = buf[0]
                    let response = ((1 << 2) - 1) & a;
                    let id = (a >> 2);
                    if (response == 1) {

                        if (!this._playerList.hasOwnProperty(id)) {
                            await this.createRemotePlayer(id)
                        }
                        let p: RemoteCharacterController = this._playerList[id]

                        p._avatar.position.x = this.extractFloatPos(buf.slice(1, 4))
                        p._avatar.position.z = this.extractFloatPos(buf.slice(4, 7))
                    } else if (response == 0) {
                        if (this._playerList.hasOwnProperty(id)) {
                            let p: RemoteCharacterController = this._playerList[id]
                            let x = this.extractFloat(buf.slice(1, 3))
                            let y = this.extractFloat(buf.slice(3, 5))
                            let z = this.extractFloat(buf.slice(5, 7))
                            let ang = this.extractFloatAng(buf.slice(7, 10))
                            p.setMoveData(new BABYLON.Vector3(x, y, z))
                            p._avatar.rotation.y = ang;
                            try{
                                if(this._rp_audio.hasOwnProperty(id)){
                                    VoxeetSDK.conference.setSpatialPosition(this._rp_audio[id], {x,y:0,z});
                                }
                            }catch(e){
                                console.error("At RP audio spatial: "+e)
                            }
                        }
                    } else if (response == 3) {
                        if (this._playerList.hasOwnProperty(id)) {
                            let p: RemoteCharacterController = this._playerList[id]
                            p._avatar.dispose()
                            delete this._playerList[id]
                        }
                    }


                }
            }

            return new Promise((resolve, reject) => {
                this._ws.onopen = () => {
                    console.log("Websocket Connection Opened!")
                    this._ws.send(JSON.stringify({
                        action: "join",
                        //set it to dynamic
                        room: this._roomId
                    }))
                    resolve();
                };
            });

        } catch (e) {
            console.error(e)
        }
    }


    async createScene() {
        // Create a basic BJS Scene object.

        // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
        this._camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", (Math.PI / 2 + this._player.rotation.y), Math.PI / 2.5, 5, new BABYLON.Vector3(this._player.position.x, this._player.position.y + 1.5, this._player.position.z), this._scene);

        this._camera.wheelPrecision = 15;
        this._camera.checkCollisions = false;
        //make sure the keyboard keys controlling camera are different from those controlling player
        //here we will not use any keyboard keys to control camera
        this._camera.keysLeft = [];
        this._camera.keysRight = [];
        this._camera.keysUp = [];
        this._camera.keysDown = [];
        //how close can the camera come to player
        this._camera.lowerRadiusLimit = 2;
        //how far can the camera go from the player
        this._camera.upperRadiusLimit = 20;
        this._camera.attachControl(this._canvas, false);

        this.createCC()
        // Create a basic light, aiming 0,1,0 - meaning, to the sky.
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);

        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {
            size: 1000.0
        }, this._scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("gallexy/", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        skybox.material = skyboxMaterial;

        var gl = new BABYLON.GlowLayer("glow", this._scene);
        gl.intensity = 0.4;

        new BABYLON.ScreenSpaceReflectionPostProcess("ssr", this._scene, 1.0, this._camera);

        let alpha = 0;
        this._scene.registerBeforeRender(() => {
            try{
                VoxeetSDK.conference.setSpatialPosition(VoxeetSDK.session.participant, {x:this._player.position._x,y:0,z:this._player.position._z});
                VoxeetSDK.conference.setSpatialDirection(VoxeetSDK.session.participant, {x: 0, y:  this._player.rotation._y * (180/Math.PI),z: 0});
            }catch(e){
                console.error("at local spatial: "+e)
            }
            skybox.rotation.y = alpha;
            if (this._cc._moveVector && this._cc.anyMovement() && (this._cc._act._walk || this._cc._act._walkback || this._cc._act._stepLeft || this._cc._act._stepRight)) {
                let tmp = this._cc._moveVector
                this._ws.send(Buffer.concat([this.compressFloat(tmp.x), this.compressFloat(tmp.y), this.compressFloat(tmp.z), this.compressFloatAng(this._player.rotation.y % 360)]))

                let buf_list = [this.compressFloatPos(this._player.position.x), this.compressFloatPos(this._player.position.z)]
                this._ws.send(Buffer.concat(buf_list))

            }
            alpha += 0.001;
        });

        await this.loadMeshes()
        this.screen_helper()
    }


    startRenderLoop() {
        this.updatePlayers()
        this.updateTeamList()
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
    }

    compressFloat(val) {
        const buf = Buffer.alloc(2)
        ieee754.write(buf, val, 0, true, 15, 2)
        return buf;
    }

    extractFloat(buf) {
        const num = ieee754.read(buf, 0, true, 15, 2)
        return num;
    }

    compressFloatAng(val) {
        const buf = Buffer.alloc(3)
        ieee754.write(buf, val, 0, true, 16, 3)
        return buf;
    }

    extractFloatAng(buf) {
        const num = ieee754.read(buf, 0, true, 16, 3)
        return num;
    }

    extractFloatPos(buf) {
        const num = ieee754.read(buf, 0, true, 16, 3)
        return num;
    }

    compressFloatPos(val) {
        const buf = Buffer.alloc(3)
        ieee754.write(buf, val, 0, true, 16, 3)
        return buf;
    }


    async create_screen(id, position: BABYLON.Vector3, rotation) {
        let videoMat = new BABYLON.StandardMaterial(`screen_material_${id}`, this._scene);
        videoMat.backFaceCulling = false;
        videoMat.specularColor = new BABYLON.Color3(255, 0, 0);
        videoMat.roughness = 1;


        var txt = new BABYLON.DynamicTexture(`canvas_sc`, {
            width: 600,
            height: 400
        }, this._scene);


        let screen = this._scene.getMeshByName('canvas_screen')
        let new_screen = screen.clone(`screen_${id}`);
        new_screen.checkCollisions = false;
        new_screen.position = position;
        new_screen.rotate(new BABYLON.Vector3(0, 1, 0), rotation, 0);
        videoMat.diffuseTexture = txt
        new_screen.material = videoMat



        /*let ellipsoid = this.drawEllipsoid(new_screen, `ellip_screen_${id}`, 20, 25, 10, true)
        ellipsoid.actionManager = new BABYLON.ActionManager(this._scene);
        ellipsoid.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: this._scene.getMeshByName("__ellipsoid__"),
                },
                () => {

                    console.log(`screen_${id} collide`)
                },
            ),

        );
        ellipsoid.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnIntersectionExitTrigger,
                    parameter: this._scene.getMeshByName("__ellipsoid__"),
                },
                () => {

                    console.log(`screen_${id} collision exited`)
                },
            ),
        );*/


    }

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    async screen_helper() {

        //this.create_screen(0, new BABYLON.Vector3(0, -0.3, 16), Math.PI)


        let idelcanvasMat = new BABYLON.StandardMaterial("screen_idle_mat", this._scene);
        idelcanvasMat.backFaceCulling = false;
        idelcanvasMat.specularColor = new BABYLON.Color3(255, 0, 0);
        idelcanvasMat.roughness = 1;

        let idleCanvas = new BABYLON.DynamicTexture(`idleCanvas`, {
            width: 600,
            height: 400
        }, this._scene);

        idelcanvasMat.diffuseTexture = idleCanvas
        this.idleCanvas = idleCanvas
        this.idelcanvasMat = idelcanvasMat;


        let screen = this._scene.getMeshByName("canvas_screen")
        screen.checkCollisions = false;
        screen.material = idelcanvasMat

        for(let i=1;i<=4;i++){
            let screen = this._scene.getMeshByName(`canvas_screen${i}`)
            let videoTexture = null
            let material = new BABYLON.StandardMaterial(`canvas_screen_mat${i}`, this._scene)
            this.sideScreens[i] = {mesh: screen, play: false,player:null,  material, videoTexture}
            screen.checkCollisions = false;
            screen.material = idelcanvasMat;
        }
 
        idelcv.start(this.idleCanvas.getContext(), this.idleCanvas)


        //$( 'body' ).append( `<video id="videojs-theta-plugin-player_${id}" class="video-js vjs-default-skin" controls="" playsinline="" hidden></video>`);


        /*let videoMat = new BABYLON.StandardMaterial("textVid", this._scene);
        videoMat.backFaceCulling = false;
        videoMat.specularColor = new BABYLON.Color3(255, 0, 0);
        videoMat.roughness = 1;*/



        /*  const optionalHlsOpts = null;
          const optionalThetaOpts = {
            allowRangeRequests: true, // false if cdn does not support range headers  
          };
          const player = videojs('videojs-theta-plugin-player', {
                  techOrder: ["theta_hlsjs", "html5"],
                  sources:[{
                      src: "http://127.0.0.1:7935/stream/".concat("0x80d639396bf022e61dcbf4edfa6c0f367f558891", ".m3u8?ts=").concat( (new Date).getTime()),
                      type: "application/x-mpegURL",
                      label: "Auto"
                  }],
                  theta_hlsjs: {
                      videoId: "test",
                      userId: "user1", 
                      onThetaReady: null, // optional listener
                      onStreamReady:  ()=> {
                          setTimeout( ()=> {
                              player.autoplay("any")
                              let vp1 = $( "#videojs-theta-plugin-player" ).children("video")[0]
                              let vtx = new BABYLON.VideoTexture('vtx1', vp1, this._scene, true, true);
                              videoMat.diffuseTexture = vtx;
                              screen.material = videoMat;

                          }, 500)
                      },
                      hlsOpts: optionalHlsOpts,
                      thetaOpts: optionalThetaOpts,
                  }
              });*/




        /*const box = BABYLON.MeshBuilder.CreateBox("test_box", {
            height:1,
            width:1
        }, this._scene);
        box.position.y = -1.8
        box.position.x= this.randomPosition(-9.0,9.0)
        box.position.z = this.randomPosition(0.0,13.0)
        let ellipsoid =  this._scene.getMeshByName("__ellipsoid__")
        ellipsoid.actionManager = new BABYLON.ActionManager(this._scene);
        ellipsoid.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter:  box,
                },
                () => {
                    this._remoteChannel.join("test")
                    console.log("Collison found...")
                },
            ),
   
        );
        ellipsoid.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionExitTrigger,
                    parameter: box,
                },
                () => {
                    this._remoteChannel.leave("test")
                    console.log("Collison Exited...")
                },
            ),
   
        );*/


    }



    async createCC() {
        this._cc = new CharacterController(this._player, this._camera, this._scene);
        this._cc.setFaceForward(true);
        this._cc.setMode(0);
        this._cc.setTurnSpeed(45);
        this._cc.setCameraTarget(new BABYLON.Vector3(0, 1.5, 0));
        this._cc.setNoFirstPerson(false);
        this._cc.setStepOffset(0.4);
        this._cc.setSlopeLimit(30, 60);;
        this._cc.start();
    }


    async loadimage(img) {
        img.crossOrigin = "anonymous";
        new Promise((myResolve, myReject) => {
            img.onload = () => {
                myResolve();
            }
        });
    }


    async loadPlayer() {

        let character = await BABYLON.SceneLoader.ImportMeshAsync(null, "", "man.glb", this._scene);
        this._player = character.meshes[0]
        for (let m of character.meshes) {
            console.log(m.name)
            if (m.material) {
                console.log(m.material.name)
            }
        }
        let mat: BABYLON.PBRMaterial = this._player.getChildMeshes()[5].material.clone("player_mat1") 
        mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
        this._player.material = mat

        let mat1: BABYLON.PBRMaterial = this._player.getChildMeshes()[4].material.clone("player_mat0") 
        this._player.material = mat1

        this._player.rotation = this._player.rotationQuaternion.toEulerAngles();
        this._player.rotationQuaternion = null;

        //this._player.rotate(new BABYLON.Vector3(0,1,0),Math.PI,0);
        //this._player.position.y=2.1;
        // mat.diffuseTexture = new BABYLON.Texture("https://d5nunyagcicgy.cloudfront.net/external_assets/hero_examples/hair_beach_v391182663/original.jpeg");

        this._player.position.x = this.randomPosition(-9.0, 9.0)
        this._player.position.z = this.randomPosition(0.0, 13.0)

        let buf_list = [this.compressFloatPos(this._player.position.x), this.compressFloatPos(this._player.position.z)]
        this._ws.send(Buffer.concat(buf_list))

        //this.drawEllipsoid(this._player, "__ellipsoid__", 1, 8, 8, true)

        this._player.checkCollisions = true;
        this._player.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
        this._player.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0);
        await this.fetchEvent()
        window.buynft = async (tid, price) => {
            let isMetmask = await this.check_metamask()
            let address = (await window.web3.eth.getAccounts())[0]
            if(isMetmask){
                const myContract = new window.web3.eth.Contract(
                    abi,
                   "0x07D895F3f3f8861a72C80e7a71fae8DfE547D875"
                  );
                  await myContract.methods.buy(tid).send({ from: address, value: price});
            }else{
                notify('Please install metamask!')
            }
        }
    }

    randomPosition(x, y): Number {
        return Number((Math.random() * (x - y) + y).toFixed(4))
    }

    drawEllipsoid(mesh, name, x, y, z, hide = false) {
        mesh.computeWorldMatrix(true);
        if (hide) {
            var ellipsoidMat = mesh.getScene().getMaterialByName("__ellipsoidMat__h");
            if (!ellipsoidMat) {
                ellipsoidMat = new BABYLON.StandardMaterial("__ellipsoidMat__h", mesh.getScene());
                ellipsoidMat.alpha = 0;
            }
        } else {
            var ellipsoidMat = mesh.getScene().getMaterialByName("__ellipsoidMat__");
            if (!ellipsoidMat) {
                ellipsoidMat = new BABYLON.StandardMaterial("__ellipsoidMat__", mesh.getScene());
                ellipsoidMat.wireframe = true;
                ellipsoidMat.emissiveColor = BABYLON.Color3.Green();
                ellipsoidMat.specularColor = BABYLON.Color3.Black();
            }
        }

        var ellipsoid = BABYLON.Mesh.CreateSphere(name, 9, 1, mesh.getScene());
        ellipsoid.scaling = mesh.ellipsoid.clone();
        ellipsoid.scaling.y *= x;
        ellipsoid.scaling.x *= y;
        ellipsoid.scaling.z *= z;
        ellipsoid.material = ellipsoidMat;
        ellipsoid.parent = mesh;
        ellipsoid.computeWorldMatrix(true);
        return ellipsoid;
    }

    async createRemotePlayer(id) {
        let rp = this._player.clone(`rp_${id}`)

        rp.checkCollisions = false;
        this._player.checkCollisions = false;
        rp.position.y = -1.6;

        rp.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
        rp.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0);

        this._playerList[id] = new RemoteCharacterController(rp, this._scene, id, this._roomId);
        if (this._rcolor.hasOwnProperty(id)) {
            this._playerList[id].setColor(this._rcolor[id])
        }
        this._playerList[id].start()

    }


    async loadMeshes() {
        let Icosphere = await BABYLON.SceneLoader.ImportMeshAsync(null, "", "dome_multi_screen.glb", this._scene);
        for (let m of Icosphere.meshes) {
            //console.log(m.name)
            m.checkCollisions = true;
        }
        let Icosphere = await BABYLON.SceneLoader.ImportMeshAsync(null, "", "theta_token.glb", this._scene);
        for (let m of Icosphere.meshes) {
            m.checkCollisions = false;
        }
        let theta_ = Icosphere.meshes[0] 
        theta_.position.z = 16
        theta_.scaling = new BABYLON.Vector3(4,4,4)
        let anim1 = Icosphere.animationGroups[1] 
        anim1.start(true, 1.0, anim1.from, anim1.to, false);
        
        /*let Icosphere = await BABYLON.SceneLoader.ImportMeshAsync(null, "", "digital_board.glb", this._scene);
        for (let m of Icosphere.meshes) {
            console.log(m.name)
        }

        var groundWidth = 2;
        var groundHeight = 0.5;

        var ground = BABYLON.MeshBuilder.CreateGround("ground1", {
            width: groundWidth,
            height: groundHeight,
            subdivisions: 25
        }, this._scene);
        var txt = new BABYLON.DynamicTexture(`canvas_brd`, {
            width: 512,
            height: 256
        }, this._scene);
        let bmat: StandardMaterial = new BABYLON.StandardMaterial('ww', this._scene)

        bmat.diffuseTexture = txt
        ground.material = bmat
        this.brdcanvas = txt*/


        let pbr_stage0 = new BABYLON.PBRMaterial("pbr", this._scene);
        let pbr_stage1 = new BABYLON.PBRMaterial("pbr", this._scene);

        let stage_mesh_0 = this._scene.getMeshByName("stage_primitive0")
        let stage_mesh_1 = this._scene.getMeshByName("stage_primitive1")
        let cylinder0 = this._scene.getMeshByName("Cylinder_primitive0")

        stage_mesh_0.material = pbr_stage0;
        stage_mesh_1.material = pbr_stage1;

        pbr_stage0.metallic = 1.0;
        pbr_stage0.roughness = 0.2;
        pbr_stage1.metallic = 1.0;
        pbr_stage1.roughness = 0.1;
        pbr_stage0.subSurface.isRefractionEnabled = true;
        pbr_stage1.subSurface.isRefractionEnabled = true;

        var glass = new BABYLON.PBRMaterial("glass", this._scene);

        glass.indexOfRefraction = 0.52;
        glass.alpha = 0.1;
        glass.directIntensity = 0.0;
        glass.environmentIntensity = 0.7;
        glass.cameraExposure = 0.66;
        glass.cameraContrast = 1.66;
        glass.microSurface = 1;
        glass.subSurface.isRefractionEnabled = true;
        glass.reflectivityColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        glass.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        cylinder0.material = glass;

        var gl = new BABYLON.GlowLayer("glow", this._scene);

        gl.addIncludedOnlyMesh(this._scene.getMeshByName("Cylinder.003"))
        gl.addIncludedOnlyMesh(this._scene.getMeshByName("Cylinder.007"))
        gl.addIncludedOnlyMesh(this._scene.getMeshByName("Cylinder.008"))
        gl.addIncludedOnlyMesh(this._scene.getMeshByName("Cylinder.009"))
        gl.addIncludedOnlyMesh(this._scene.getMeshByName("Cylinder.010"))
        gl.intensity = 0.1;

    }

    doRender(): void {
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}