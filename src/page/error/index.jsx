import React        from 'react';
import { Link }     from 'react-router-dom';

import PageTitle    from 'component/page-title/index.jsx';

class Error extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return (
            <div id="page-wrapper">
                <PageTitle title="出错啦!"/>
                <div className="row">
                    <div className="col-md-12">
                        <span>Can't find path</span>
                        <Link to="/">Go back to homepage</Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default Error;