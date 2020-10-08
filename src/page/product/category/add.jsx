import React        from 'react';
import MUtil        from 'util/mm.jsx'
import Product      from 'service/product-service.jsx'

import PageTitle    from 'component/page-title/index.jsx';

const _mm           = new MUtil();
const _product      = new Product();


class CategoryAdd extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            categoryList    : [],
            parentId        : 0,
            categoryName    : ''
        };
    }

    componentDidMount(){
        this.loadCategoryList();
    }

    loadCategoryList(){
        _product.getCategoryList().then(res => {
            this.setState({
                categoryList : res
            });
        }, errMsg => {
            _mm.errorTips(errMsg);
        });
    }

    onValueChange(e){
        let name    = e.target.name,
            value   = e.target.value;
        this.setState({
            [name] : value
        });
    }

    onSubmit(e){
        let categoryName = this.state.categoryName.trim();
        if(categoryName){
            _product.saveCategory({
                parentId        : this.state.parentId,
                categoryName    : categoryName
            }).then((res) => {
                _mm.successTips(res);
                this.props.history.push('/product-category/index');
            }, (errMsg) => {
                _mm.errorTips(errMsg);
            });
        }
        else{
            _mm.errorTips('Please enter the category name');
        }
    }
    render(){
        return (
            <div id="page-wrapper">
                <PageTitle title="Category list"/>
                <div className="row">
                    <div className="col-md-12">
                        <div className="form-horizontal">
                            <div className="form-group">
                                <label className="col-md-2 control-label">Category</label>
                                <div className="col-md-5">
                                    <select name="parentId" 
                                        className="form-control"
                                        onChange={(e) => this.onValueChange(e)}>
                                        <option value="0">Root category/</option>
                                        {
                                            this.state.categoryList.map((category, index) => {
                                                return <option value={category.id} key={index}>Root category/{category.name}</option>
                                            })
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-md-2 control-label">Category name</label>
                                <div className="col-md-5">
                                    <input type="text" className="form-control" 
                                        placeholder="Please enter category name"
                                        name="categoryName"
                                        value={this.state.name}
                                        onChange={(e) => this.onValueChange(e)}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="col-md-offset-2 col-md-10">
                                    <button type="submit" className="btn btn-primary" 
                                        onClick={(e) => {this.onSubmit(e)}}>Submit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CategoryAdd;