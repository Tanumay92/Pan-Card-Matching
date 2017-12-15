//-----!!Importing Packages!!------
var express=require('express');
var app=express();
var ejs=require('ejs');
var body=require('body-parser');
var session=require('express-session');
var db=require('mysql');
var csv=require('fast-csv');
var json=require('csvtojson');
var upload=require('express-fileupload');
var fs=require('fs');

//-------!!Creating Connection with Mysql Database!!------
var con=db.createConnection({
    host:'localhost',
    user:'root',
    password:'admin',
    database:'assignment',
    port:'3306'
});

//-------!!Declaring Dependencies!!-------
app.use(upload());
app.use(body.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(session({
  secret:'secret',
  resave:true,
saveUninitialized:true
}));

//-----!!ROUTING USER PAGE!!------
app.get('/',function(req,res){
    res.render('user');
});

//-----!!ROUTING PAN CHECKING POST!!-----
app.post('/',function(req,res){
    var pan_no=req.body.pan;
    if(!pan_no){
        res.render('panblank');
    }
    else{
         var sql="SELECT*FROM pancard where Pan_NO="+db.escape(pan_no);
         con.query(sql,function(err,fields_pan){
             var row_count=fields_pan.length;
             if(err){
                 res.send('Internal Server Error! Please Try again later.<br/> <a href="/">Click Here</a> to go back Home');
             }
             else if(row_count==0){
                 res.render('user3');
             }
             else{
                 var count=parseInt(fields_pan[0].count,10);
                 var pan=fields_pan[0].Pan_NO;
                 var count1=count+1;
                 var count2=""+count1;
                 console.log(count2);
                 var day=new Date().getDate();
                 var month=new Date().getMonth();
                 var year=new Date().getFullYear();
                 var hour=new Date().getHours();
                 var min=new Date().getMinutes();
                 var sec=new Date().getSeconds();
                 console.log(new Date().getDate());

                 var date=day+'/'+month+'/'+year;
                 var time=hour+':'+min+':'+sec;
                 console.log(date);
                 console.log(time);
                 var sql="UPDATE pancard SET count="+db.escape(count2)+",last_search_date="+db.escape(date)+",last_search_time="+db.escape(time)+" WHERE Pan_NO="+db.escape(pan);
                 console.log(sql);
                 con.query(sql,function(err,fields_pan2){
                     if(err){
                         console.log(err);
                     }
                 })
                 res.render('user2');
             }
         })
    }
});

//-----!!ROUTING ADMIN LOGIN!!------
app.get('/admin',function(req,res){
    res.render('adminlog');
});

//-----!!ROUTING ADMINLOG POST!!-----
app.post('/admin',function(req,res){
    var u_name=req.body.u_name;
    var pass=req.body.pass;
    if(!u_name || !pass){
           res.render('logblank');
    }
    else{
        var sql="SELECT*FROM admin where Email="+db.escape(u_name)+" AND Password="+db.escape(pass);
        con.query(sql,function(err,fields){
            var row_count=fields.length;
            if(err){
                res.send('Internal Server Error! Please try again later. <br/><a href=\"/\"><button>Home</button></a>');
            }
            else if(row_count==1){
                req.session.user=fields[0].Name;
                res.redirect('/admin/home');
            }
            else{
             res.render('logfail');
            }
        })
    }
})

//------!!ADMIN HOME PAGE!!-------
app.get('/admin/home',function(req,res){
    if(!req.session.user){
        res.redirect('/admin');
    }
    else{
        var sql="SELECT*FROM pancard ORDER BY ID DESC";
        con.query(sql,function(err,fields){
           if(err){

           }
           else{
               res.render('adminhome',{
                   user:req.session.user,
                   fields:fields
               })
           }
        })
    }
})

//------!!File Upload!!------
app.post('/admin/upload',function(req,res){
    if(req.files){
        console.log(req.files);
       var show=req.files;
       var file=req.files.filename,
       filename=file.name;
    console.log(file.name);
    var path="upload/"+file.name;
    console.log(path);
       file.mv('./upload/'+filename,function(err,field){
           if(err){
               console.log(err);
           }
           else{
            res.redirect('/admin/home');
           }
         var stream=fs.createReadStream(''+path);
     /* csv.fromStream(stream,{headers:true}).on("data", function(data){
     console.log(data.Pan_NO);
 })*/ 
 const csvFilePath=path;

json()
.fromFile(csvFilePath)
.on('json',(jsonObj)=>{
    var id=jsonObj.ID;
    var pan=jsonObj.Pan_NO;
    var created=new Date();
    var panPat = /^([a-zA-Z]{5})(\d{4})([a-zA-Z]{1})$/;
    
        var panobj=pan;
    
  // if (panobj.search(panPat) == -1){
    var sqlcheck="select*from pancard where Pan_NO="+db.escape(pan);
    con.query(sqlcheck,function(err,fields_ret){
        var rows=fields_ret.length;
        if(err){
            console.log(err);
        }
        else if(rows==0){
        
    values=[[
        pan,created,0,0
    ]];
    var sql="INSERT INTO pancard(Pan_NO,Created,count,last_search) VALUES(?)";
    con.query(sql,values,function(err,fields){
        if(err){
            console.log(err);
        }
        else{
            console.log('Data inserted ');
            //res.redirect('/admin/home');
        }
    })
         
       }
        else{
            console.log('Data Not Inserted');
            //res.redirect('/admin/home');
        }
    
    })
    // combine csv header row and csv line to a json object 
    // jsonObj.a ==> 1 or 4 
 /*  }
else{
    console.log('Incorrect Data');
}*/
    
})
.on('done',(error)=>{
    console.log('end')
});
 
       })
}
})

//------!!USERLOG!!-------
app.get('/admin/userlog',function(req,res){
    if(!req.session.user)
    {
        res.redirect('/admin');
    }
    else{
        var sql="SELECT*FROM pancard ORDER BY ID DESC";
        con.query(sql,function(err,fields){
           if(err){

           }
           else{
               console.log(fields)
               res.render('userlog',{
                   user:req.session.user,
                   fields:fields
               })
           }
        })
    }
})


//-------!!ROUTING LOGOUT!!------
app.get('/admin/logout',function(req,res){
    req.session.destroy();
    res.redirect('/admin');
});

//------!!LISTENING TO PORT 3000!!------
app.listen(3000,function(req,res){
    console.log('Server Running at http://localhost:3000');
})