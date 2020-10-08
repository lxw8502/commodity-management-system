
import React    from 'react';
import PT       from 'prop-types';
const emptyFunction = function() {}
let currentIEID = 0
const IEFormGroup = [true]
let xhrList = []
let currentXHRID = 0

class FileUpload extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            chooseBtn: {},       
            uploadBtn: {},       
            before: [], 
            middle: [],      
            after: []        
        }
    }

    _updateProps(props) {
        this.isIE = !(this.checkIE() < 0 || this.checkIE() >= 10)
        const options = props.options
        this.baseUrl = options.baseUrl     
        this.param = options.param     
        this.chooseAndUpload = options.chooseAndUpload || false      
        this.paramAddToField = options.paramAddToField || undefined  
        this.dataType = 'json'
        options.dataType && (options.dataType.toLowerCase() == 'text') && (this.dataType = 'text')
        this.wrapperDisplay = options.wrapperDisplay || 'inline-block'     
        this.timeout = (typeof options.timeout == 'number' && options.timeout > 0) ? options.timeout : 0     
        this.accept = options.accept || ''  
        this.multiple = options.multiple || false
        this.numberLimit = options.numberLimit || false 
        this.fileFieldName = options.fileFieldName || false 
        this.withCredentials = options.withCredentials || false 
        this.requestHeaders = options.requestHeaders || false 


        this.beforeChoose = options.beforeChoose || emptyFunction

        this.chooseFile = options.chooseFile || emptyFunction

        this.beforeUpload = options.beforeUpload || emptyFunction

        this.doUpload = options.doUpload || emptyFunction
  
        this.uploading = options.uploading || emptyFunction
  
        this.uploadSuccess = options.uploadSuccess || emptyFunction
 
        this.uploadError = options.uploadError || emptyFunction
     
        this.uploadFail = options.uploadFail || emptyFunction
    
        this.onabort = options.onabort || emptyFunction

        this.files = options.files || this.files || false     
    
        this.disabledIEChoose = options.disabledIEChoose || false

        this._withoutFileUpload = options._withoutFileUpload || false      
        this.filesToUpload = options.filesToUpload || []     
        this.textBeforeFiles = options.textBeforeFiles || false 
        if (this.filesToUpload.length && !this.isIE) {
            this.filesToUpload.forEach( file => {
                this.files = [file]
                this.commonUpload()
            })
        }

        let chooseBtn, uploadBtn, flag = 0
        const before = [], middle = [], after = []
        if (this.chooseAndUpload) {
            React.Children.forEach(props.children, (child)=> {
                if (child && child.ref == 'chooseAndUpload') {
                    chooseBtn = child
                    flag++
                } else {
                    flag == 0 ? before.push(child) : flag == 1 ? middle.push(child) : ''
                }
            })
        } else {
            React.Children.forEach(props.children, (child)=> {
                if (child && child.ref == 'chooseBtn') {
                    chooseBtn = child
                    flag++
                } else if (child && child.ref == 'uploadBtn') {
                    uploadBtn = child
                    flag++
                } else {
                    flag == 0 ? before.push(child) : flag == 1 ? middle.push(child) : after.push(child)
                }
            })
        }
        this.setState({
            chooseBtn,
            uploadBtn,
            before,
            middle,
            after
        })
    }

    commonChooseFile() {
        const jud = this.beforeChoose()
        if (jud != true && jud != undefined) return
        this.refs['ajax_upload_file_input'].click()
    }

    commonChange(e) {
        let files
        e.dataTransfer ? files = e.dataTransfer.files :
          e.target ? files = e.target.files : ''

        const numberLimit = typeof this.numberLimit === 'function' ? this.numberLimit() : this.numberLimit
        if(this.multiple && numberLimit && files.length > numberLimit) {
            const newFiles = {}
            for(let i = 0; i< numberLimit; i++) newFiles[i] = files[i]
            newFiles.length = numberLimit
            files = newFiles
        }
        this.files = files
        this.chooseFile(files)
        this.chooseAndUpload && this.commonUpload()
    }
    
    commonUpload() {
        const mill = (this.files.length && this.files[0].mill) || (new Date).getTime()
        const jud = this.beforeUpload(this.files, mill)
        if (jud != true && jud != undefined && typeof jud != 'object') {
            this.refs['ajax_upload_file_input'].value = ''
            return
        }

        if (!this.files) return
        if (!this.baseUrl) throw new Error('baseUrl missing in options')

        const scope = {}
        let formData = new FormData()
        if(this.textBeforeFiles){
           formData = this.appendFieldsToFormData(formData);
        }
        if (!this._withoutFileUpload) {
            const fieldNameType = typeof this.fileFieldName

            Object.keys(this.files).forEach(key => {
                if(key == 'length') return

                if(fieldNameType == 'function') {
                    const file = this.files[key]
                    const fileFieldName = this.fileFieldName(file)
                    formData.append(fileFieldName, file)
                }else if(fieldNameType == 'string') {
                    const file = this.files[key]
                    formData.append(this.fileFieldName, file)
                }else {
                    const file = this.files[key]
                    formData.append(file.name, file)
                }
            })

        }
        /*If we need to add fields after file data append here*/
        if(!this.textBeforeFiles){
          formData = this.appendFieldsToFormData(formData);
        }
        const baseUrl = this.baseUrl

        const param = typeof this.param === 'function' ? this.param(this.files) : this.param

        let paramStr = ''

        if (param) {
            const paramArr = []
            param['_'] = mill
            Object.keys(param).forEach(key =>
              paramArr.push(`${key}=${param[key]}`)
            )
            paramStr = '?' + paramArr.join('&')
        }
        const targeturl = baseUrl + paramStr

        const xhr = new XMLHttpRequest()
        xhr.open('POST', targeturl, true)

        xhr.withCredentials = this.withCredentials
        const rh = this.requestHeaders
        rh && Object.keys(rh).forEach(key =>
            xhr.setRequestHeader(key, rh[key])
        )

        if(this.timeout) {
            xhr.timeout = this.timeout
            xhr.ontimeout = () => {
                this.uploadError({type: 'TIMEOUTERROR', message: 'timeout'})
                scope.isTimeout = false
            }
            scope.isTimeout = false
            setTimeout(()=>{
                scope.isTimeout = true
            },this.timeout)
        }

        xhr.onreadystatechange = () => {
            /*xhr finish*/
            try {
                if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                    const resp = this.dataType == 'json' ? JSON.parse(xhr.responseText) : xhr.responseText
                    this.uploadSuccess(resp)
                } else if (xhr.readyState == 4) {
                    /*xhr fail*/
                    const resp = this.dataType == 'json' ? JSON.parse(xhr.responseText) : xhr.responseText
                    this.uploadFail(resp)
                }
            } catch (e) {
                !scope.isTimeout && this.uploadError({type: 'FINISHERROR', message: e.message})
            }
        }
        /*xhr error*/
        xhr.onerror = () => {
            try {
                const resp = this.dataType == 'json' ? JSON.parse(xhr.responseText) : xhr.responseText
                this.uploadError({type: 'XHRERROR', message: resp})
            } catch (e) {
                this.uploadError({type: 'XHRERROR', message: e.message})
            }
        }
        xhr.onprogress = xhr.upload.onprogress = progress => {
            this.uploading(progress, mill)
        }

        this._withoutFileUpload ? xhr.send(null) : xhr.send(formData)

        xhrList.push(xhr)
        const cID = xhrList.length - 1
        currentXHRID = cID

        xhr.onabort = () => this.onabort(mill, cID)

        this.doUpload(this.files, mill, currentXHRID)

        this.refs['ajax_upload_file_input'].value = ''
    }

    appendFieldsToFormData(formData){
        const field = typeof this.paramAddToField == 'function' ? this.paramAddToField() : this.paramAddToField
        field &&
            Object.keys(field).map(index=>
                formData.append(index, field[index])
            )
        return formData
    }


    IEBeforeChoose(e) {
        const jud = this.beforeChoose()
        jud != true && jud != undefined && e.preventDefault()
    }

    IEChooseFile(e) {
        this.fileName = e.target.value.substring(e.target.value.lastIndexOf('\\') + 1)
        this.chooseFile(this.fileName)
        this.chooseAndUpload && (this.IEUpload() !== false) &&
            document.getElementById(`ajax_upload_file_form_${this.IETag}${currentIEID}`).submit()
        e.target.blur()
    }

    IEUpload(e) {
        const mill = (new Date).getTime()
        const jud = this.beforeUpload(this.fileName, mill)
        if(!this.fileName || (jud != true && jud != undefined) ) {
            e && e.preventDefault()
            return false
        }
        const that = this

        const baseUrl = this.baseUrl

        const param = typeof this.param === 'function' ? this.param(this.fileName) : this.param
        let paramStr = ''

        if (param) {
            const paramArr = []
            param['_'] = mill
            param['ie'] === undefined && (param['ie'] = 'true')
            for (const key in param) {
                if(param[key] != undefined) paramArr.push(`${key}=${param[key]}`)
            }
            paramStr = '?' + paramArr.join('&')
        }
        const targeturl = baseUrl + paramStr

        document.getElementById(`ajax_upload_file_form_${this.IETag}${currentIEID}`).setAttribute('action', targeturl)
        const getFakeProgress = this.fakeProgress()
        let loaded = 0,
          count = 0

        const progressInterval = setInterval(() => {
            loaded = getFakeProgress(loaded)
            this.uploading({
                loaded,
                total: 100
            },mill)
            ++count >= 150 && clearInterval(progressInterval)
        },200)


        const partIEID = currentIEID
        window.attachEvent ?
          document.getElementById(`ajax_upload_file_frame_${this.IETag}${partIEID}`).attachEvent('onload', handleOnLoad) :
          document.getElementById(`ajax_upload_file_frame_${this.IETag}${partIEID}`).addEventListener('load', handleOnLoad)


        function handleOnLoad() {
            clearInterval(progressInterval)
            try {
                that.uploadSuccess(that.IECallback(that.dataType, partIEID))
            } catch (e) {
                that.uploadError(e)
            } finally {
                const oInput = document.getElementById(`ajax_upload_hidden_input_${that.IETag}${partIEID}`)
                oInput.outerHTML = oInput.outerHTML
            }
        }
        this.doUpload(this.fileName, mill)
        IEFormGroup[currentIEID] = false

    }

    IECallback(dataType, frameId) {
        IEFormGroup[frameId] = true
        const frame = document.getElementById(`ajax_upload_file_frame_${this.IETag}${frameId}`)
        const resp = {}
        const content = frame.contentWindow ? frame.contentWindow.document.body : frame.contentDocument.document.body
        if(!content) throw new Error('Your browser does not support async upload')
        try {
            resp.responseText = content.innerHTML || 'null innerHTML'
            resp.json = JSON ? JSON.parse(resp.responseText) : eval(`(${resp.responseText})`)
        } catch (e) {
            if (e.message && e.message.indexOf('Unexpected token') >= 0) {
                if (resp.responseText.indexOf('{') >= 0) {
                    const msg = resp.responseText.substring(resp.responseText.indexOf('{'), resp.responseText.lastIndexOf('}') + 1)
                    return JSON ? JSON.parse(msg) : eval(`(${msg})`)
                }
                return {type: 'FINISHERROR', message: e.message}
            }
            throw e
        }
        return dataType == 'json' ? resp.json : resp.responseText
    }

    forwardChoose() {
        if(this.isIE) return false
        this.commonChooseFile()
    }

    fowardRemoveFile(func) {
        this.files = func(this.files)
    }

    filesToUpload(files) {
        if(this.isIE) return
        this.files = files
        this.commonUpload()
    }

    abort(id) {
        id === undefined ? 
            xhrList[currentXHRID].abort() :
            xhrList[id].abort()
    }

    checkIE() {
        const userAgent = this.userAgent;
        const version = userAgent.indexOf('MSIE')
        if (version < 0) return -1

        return parseFloat(userAgent.substring(version + 5, userAgent.indexOf(';', version)))
    }

    fakeProgress() {
        let add = 6
        const decrease = 0.3,
          end = 98,
          min = 0.2
        return (lastTime) => {
            let start = lastTime
            if (start >= end) return start

            start += add
            add = add - decrease
            add < min && (add = min)

            return start
        }
    }

    getUserAgent() {
        const userAgentString = this.props.options && this.props.options.userAgent;
        const navigatorIsAvailable = typeof navigator !== 'undefined';        
        if (!navigatorIsAvailable && !userAgentString) {
            throw new Error('\`options.userAgent\` must be set rendering react-fileuploader in situations when \`navigator\` is not defined in the global namespace. (on the server, for example)');
        }
        return navigatorIsAvailable ? navigator.userAgent : userAgentString;
    }

    componentWillMount() {
        this.userAgent = this.getUserAgent();
        this.isIE = !(this.checkIE() < 0 || this.checkIE() >= 10)
        const tag = this.props.options && this.props.options.tag
        this.IETag = tag ? tag+'_' : ''

        this._updateProps(this.props)
    }

    componentDidMount() {
    }

    componentWillReceiveProps(newProps) {
        this._updateProps(newProps)
    }

    render() {
        return this._packRender()
    }

    _packRender() {
        let render = ''
        if (this.isIE) {
            render = this._multiIEForm()
        } else {
            const restAttrs = {
                accept: this.accept,
                multiple: this.multiple
            }
            render = (
                <div className={this.props.className} style={this.props.style}>
                    {this.state.before}
                    <div onClick={(e) => this.commonChooseFile(e)}
                        style={{overflow:'hidden',postion:'relative',display:this.wrapperDisplay}}
                    >
                        {this.state.chooseBtn}
                    </div>
                    {this.state.middle}

                    <div onClick={(e) => this.commonUpload(e)}
                        style={{
                            overflow: 'hidden',
                            postion: 'relative',
                            display: this.chooseAndUpload ? 'none' : this.wrapperDisplay
                        }}
                    >
                        {this.state.uploadBtn}
                    </div>
                    {this.state.after}
                    <input type="file" name="ajax_upload_file_input" ref="ajax_upload_file_input"
                        style={{display:'none'}} onChange={(e) => this.commonChange(e)}
                        {...restAttrs}
                    />
                </div>
            )
        }
        return render
    }

    _multiIEForm() {
        const formArr = []
        let hasFree = false

        const isDisabled =
          typeof this.disabledIEChoose === 'function' ? this.disabledIEChoose() : this.disabledIEChoose

        for(let i = 0; i<IEFormGroup.length;  i++) {
            _insertIEForm.call(this,formArr,i)
            if(IEFormGroup[i] && !hasFree) {
                hasFree = true
                currentIEID = i
            }
            (i==IEFormGroup.length-1) && !hasFree && IEFormGroup.push(true)

        }

        return (
            <div className={this.props.className} style={this.props.style} id="react-file-uploader">
                {formArr}
            </div>
        )

        function _insertIEForm(formArr,i) {
            if(IEFormGroup[i] && hasFree) return
            const isShow = IEFormGroup[i]
            const style = {
                position:'absolute',
                left:'-30px',
                top:0,
                zIndex:'50',
                fontSize:'80px',
                width:'200px',
                opacity:0,
                filter:'alpha(opacity=0)'
            }

            const restAttrs = {
                accept: this.accept,
                disabled: isDisabled
            }

            const input =
                <input type="file" name={`ajax_upload_hidden_input_${i}`} id={`ajax_upload_hidden_input_${i}`}
                    ref={`ajax_upload_hidden_input_${i}`} onChange={(e) => this.IEChooseFile(e)} onClick={(e) => this.IEBeforeChoose(e)}
                    style={style} {...restAttrs}
                />

            i = `${this.IETag}${i}`
            formArr.push((
                <form id={`ajax_upload_file_form_${i}`} method="post" target={`ajax_upload_file_frame_${i}`}
                    key={`ajax_upload_file_form_${i}`}
                    encType="multipart/form-data" ref={`form_${i}`} onSubmit={(e) => this.IEUpload(e)}
                    style={{display:isShow? 'block':'none'}}
                >
                    {this.state.before}
                    <div style={{overflow:'hidden',position:'relative',display:'inline-block'}}>
                        {this.state.chooseBtn}
                        {input}
                    </div>
                    {this.state.middle}
                    <div style={{
                        overflow:'hidden',
                        position:'relative',
                        display:this.chooseAndUpload?'none':this.wrapperDisplay
                        }}
                    >
                        {this.state.uploadBtn}
                        <input type="submit"
                            style={{
                                position:'absolute',
                                left:0,
                                top:0,
                                fontSize:'50px',
                                width:'200px',
                                opacity:0
                            }}
                        />
                    </div>
                    {this.state.after}
                </form>
            ))
            formArr.push((
                <iframe id={`ajax_upload_file_frame_${i}`}
                    name={`ajax_upload_file_frame_${i}`}
                    key={`ajax_upload_file_frame_${i}`}
                    className="ajax_upload_file_frame"
                    style={{
                        display: 'none',
                        width: 0,
                        height: 0,
                        margin: 0,
                        border: 0
                    }}
                >
                </iframe>
            ))
        }
    }

}


FileUpload.propTypes = {
    options: PT.shape({
        /*basics*/
        baseUrl: PT.string.isRequired,
        param: PT.oneOfType([PT.object, PT.func]),
        dataType: PT.string,
        chooseAndUpload: PT.bool,
        paramAddToField: PT.oneOfType([PT.object, PT.func]),
        wrapperDisplay: PT.string,
        timeout: PT.number,
        accept: PT.string,
        multiple: PT.bool,
        numberLimit: PT.oneOfType([PT.number, PT.func]),
        fileFieldName: PT.oneOfType([PT.string, PT.func]),
        withCredentials: PT.bool,
        requestHeaders: PT.object,
        /*specials*/
        tag: PT.string,
        userAgent: PT.string,
        disabledIEChoose: PT.oneOfType([PT.bool, PT.func]),
        _withoutFileUpload: PT.bool,
        filesToUpload: PT.arrayOf(PT.object),
        textBeforeFiles: PT.bool,
        /*funcs*/
        beforeChoose: PT.func,
        chooseFile: PT.func,
        beforeUpload: PT.func,
        doUpload: PT.func,
        uploading: PT.func,
        uploadSuccess: PT.func,
        uploadError: PT.func,
        uploadFail: PT.func,
        onabort: PT.func
    }).isRequired,
    style: PT.object,
    className: PT.string
};
export default FileUpload;