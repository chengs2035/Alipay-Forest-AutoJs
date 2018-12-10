/**
 * author lvyimeng
 * @version V1.0
 * @Title： 蚂蚁森林
 * @Description：蚂蚁森林自动收取能量和偷取能量
 * @date： 2018-9-14 12:33:56
 * @modify:djc8.cn 支持新版支付宝
 * @modify:djc8.cn 支持新版支付宝 20181210
 */
var myEnergeType = ["test","收集能量"];
var morningTime = "07:03"; //自己运动能量生成时间
var handimg = images.read("/sdcard/handPic.bmp");
unlock();
sleep(2000);
mainEntrence();
//程序主入口
function mainEntrence() {
    //版本检测
    checkVersion();
    //前置操作-获取权限和设置参数
    prepareThings();
    device.wakeUp();
    //注册音量下按下退出脚本监听
    registEvent();
    device.wakeUp();
    //从主页进入蚂蚁森林主页
    enterMyMainPage();
    //收集自己的能量
    collectionMyEnergy();
    device.wakeUp();
    //进入排行榜
    enterRank();
    device.wakeUp();
    //在排行榜检测是否有好有的能量可以收集
    enterOthers();
    device.wakeUp();
    //结束后返回主页面
    whenComplete();
    device.wakeUp();
}


/**
 * 等待加载收集能量页面,采用未找到指定组件阻塞的方式,等待页面加载完成
 */
function waitPage(type) {
    // 等待进入自己的能量主页
    if (type == 0) {
        desc("种树").findOne();
    }
    // 等待进入他人的能量主页
    else if (type == 1) {
        desc("TA收取你").findOne();
    }
    //再次容错处理
    sleep(1000);
}

/**
 * 进入排行榜
 */
function enterRank() {
    tLog("进入排行榜");
    swipe(520, 1600, 520, 400, 1500);
    swipe(520, 1600, 520, 400, 1500);
    swipe(520, 1600, 520, 400, 1500);
    //swipe(500, 1900, 500, 1000, 1000);
    //swipe(520, 1860, 520, 100);
    sleep(2500);
    clickByDesc("查看更多好友", 0, true, "程序未找到排行榜入口,脚本退出");
    var i = 0;
    //等待排行榜主页出现
    sleep(2000);
    while (!textEndsWith("好友排行榜").exists() && i <= 5) {
        sleep(2000);
        i++;
    }
    if (i >= 5) {
        defaultException();
    }
}
/**
 * 判断是否好有排行榜已经结束
 * @returns {boolean}
 */
function isRankEnd() {
    if (descEndsWith("没有更多了").exists()) {
        var b = descEndsWith("没有更多了").findOne();
        var bs = b.bounds();
        //tLog(bs.centerX()+":"+bs.centerY());
        if(bs.centerY()<1980){
            return true;
        }
    }
    return false;
}
/**
 * 从排行榜获取可收集好友的点击位置
 * @returns {*}
 */
function getHasEnergyfriend(type) {
    var img = getCaptureImg();
    
    //images.save(img, "/sdcard/2.jpg", "jpg", 100);
    var p = null;
    if (type == 1) {
        //因为找多图片点的算法不太好，改进为找小图片。
        p = findImage(img,handimg)
    }
    if (p != null) {
        return p;
    } else {
        return null;
    }
}
/**
 * 在排行榜页面,循环查找可收集好友
 * @returns {boolean}
 */
function enterOthers() {
    tLog("开始检查排行榜");
    var i = 1;
    var ePoint = getHasEnergyfriend(1);
    //确保当前操作是在排行榜界面
    while (ePoint == null && textEndsWith("好友排行榜").exists()) {
        //滑动排行榜 root方式的的点击调用.如无root权限,7.0及其以上可采用无障碍模式的相关函数
        swipe(520, 1800, 520, 300, 1000);
        sleep(3000);
        ePoint = getHasEnergyfriend(1);
        i++;
        var isEnd=isRankEnd();
        //检测是否排行榜结束了,修正还有能量可以收取的时候，却提前结束的问题
        if(isEnd && ePoint!=null){
            tLog("排行榜字符串已经出现，但是还有可以收集能量的好友，脚本继续运行");
        }
        if (ePoint==null && isEnd) {
            tLog("排行榜结束了,程序即将退出");
            return false;
        }
        //如果连续32次都未检测到可收集好友,无论如何停止查找(由于程序控制了在排行榜界面,且判断了结束标记,基本已经不存在这种情况了)
        else if (i > 32) {
            tLog("程序可能出错,连续" + i + "次未检测到可收集好友");
            exit();
        }
    }
    if (ePoint != null) {
        //防止某些情况，最下面的好友无法点击，所以做这个设定，保证点击的范围
        if(ePoint.y<1800){
            //点击位置相对找图后的修正，进入好友的森林页面
            tLog("检测到："+ePoint.x+":"+ePoint.y+"坐标的好友有能量可以收取噢！");
            //除以2是为了保证在最底部的好友的能量也能点的进去。
            click(ePoint.x/2, ePoint.y + 20);
            tLog("点击的位置为："+ePoint.x/2+":"+(ePoint.y+20));
            waitPage(1);
            ///(\s*这个没啥用的东西没有用噢\S*$)|(\s*收集能量\S*$)|(\s*线下支付\S*$)|(\s*行走\S*$)|(\s*共享单车\S*$)|(\s*地铁购票\S*$)|(\s*网络购票\S*$)|(\s*网购火车票\S*$)|(\s*生活缴费\S*$)|(\s*ETC缴费\S*$)|(\s*电子发票\S*$)|(\s*绿色办公\S*$)|(\s*咸鱼交易\S*$)|(\s*预约挂号\S*$)/
            var energyRegex = generateCollectionType();
            
            if (descMatches(energyRegex).exists()) {
                //这里存在一定的问题：如果sleep时间短的话，就会出现循环代码在运行，循环之后的代码也在运行，感觉出现了异步，具体原因不明
                descMatches(energyRegex).find().forEach(function(pos) {
                    var posb = pos.bounds();
                    //tLog( posb.centerX());
                    click(posb.centerX(), posb.centerY() - 50);
                    sleep(2000);
                });
            }
            //进去收集完后,递归调用enterOthers
            back();
            sleep(2000);
            var j = 0;
            //等待返回好有排行榜
            if (!textEndsWith("好友排行榜").exists() && j <= 5) {
                sleep(2000);
                j++;
            }
            if (j >= 5) {
                defaultException();
            }

        } else{
            tLog("检测到："+ePoint.x+":"+ePoint.y+"坐标的好友有能量可以收取,但是因为位置太底下，自动滑动位置，并且重新查找！");
            swipe(520, 500, 520, 300, 100);
            sleep(2000);
        }
        enterOthers();
 
    } else {
        defaultException();
    }
}

/**
 * 遍历能量类型,收集自己的能量
 */
function collectionMyEnergy() {
    tLog("遍历能量，收集自己的能量");
    //  /(\s*线下支付$)|(\s*行走$)|(\s*共享单车$)|(\s*地铁购票$)|(\s*网络购票$)|(\s*网购火车票$)|(\s*生活缴费$)|(\s*ETC缴费$)|(\s*电子发票$)|(\s*绿色办公$)|(\s*咸鱼交易$)|(\s*预约挂号$)/
    var energyRegex = generateCollectionType();
    tLog(energyRegex);
    var checkInMorning = false;

    if (descMatches(energyRegex).exists()) {
       
        if (!checkInMorning) {
            tLog("防止小树的提示遮挡,等待中");
            sleep(3000);
        }
        //这里存在一定的问题：如果sleep时间短的话，就会出现循环代码在运行，循环之后的代码也在运行，感觉出现了异步，具体原因不明
        descMatches(energyRegex).find().forEach(function(pos) {
            var posb = pos.bounds();
            //tLog( posb.centerX());
            click(posb.centerX(), posb.centerY() - 50);
            sleep(2000);
        });
    }
    tLog("自己能量收集完成");
    sleep(1000);
}

//--------------以下核心代码，无需改动---------------------
/**
 * 从支付宝主页进入蚂蚁森林我的主页
 */
function enterMyMainPage() {
    launchApp("支付宝");
    tLog("等待支付宝启动");
    var i = 0;
    sleep(3000);
    //五次尝试蚂蚁森林入口
    while (!textEndsWith("蚂蚁森林").exists() && i <= 5) {
        sleep(2000);
        i++;
    }
    clickByText("蚂蚁森林", true, "请把蚂蚁森林入口添加到主页我的应用");
    //等待进入自己的主页
    waitPage(0);
}
/**
 * 根据描述值 点击
 * @param energyType
 * @param noFindExit
 */
function clickByDesc(energyType, paddingY, noFindExit, exceptionMsg) {
    if (descEndsWith(energyType).exists()) {
        descEndsWith(energyType).find().forEach(function(pos) {
            var posb = pos.bounds();
            click(posb.centerX(), posb.centerY() - paddingY);
            sleep(2000);
        });
    } else {
        if (noFindExit != null && noFindExit) {
            if (exceptionMsg != null) {
                tLog(exceptionMsg);
                exit();
            } else {
                defaultException();
            }
        }
    }
}
/**
 * 根据text值 点击 * @param energyType * @param noFindExit
 */
function clickByText(energyType, noFindExit, exceptionMsg) {
    if (textEndsWith(energyType).exists()) {
        textEndsWith(energyType).find().forEach(function(pos) {
            var posb = pos.bounds();
            click(posb.centerX(), posb.centerY() - 60);
        });
    } else {
        if (noFindExit != null && noFindExit) {
            if (exceptionMsg != null) {
                tLog(exceptionMsg);
                exit();
            } else {
                defaultException();
            }
        }
    }
}
/**
 * 结束后返回主页面
 */
function whenComplete() {
    tLog("结束");
    back();
    sleep(1500);
    back();
    exit();
    home();
}
/**
 * 根据能量类型数组生成我的能量类型正则查找字符串
 * @returns {string}
 */
function generateCollectionType() {
    var regex = "/";
    myEnergeType.forEach(function(t, num) {
        if (num == 0) {
            regex += "(\\s*" + t + "\\S*$)";
        } else {
            regex += "|(\\s*" + t + "\\S*$)";
        }
    });
    regex += "/";
    return regex;
}

function isMorningTime() {
    var now = new Date();
    var hour = now.getHours();
    var minu = now.getMinutes();
    var targetTime = morningTime.split(":");
    if (Number(targetTime[0]) == hour && Math.abs(Number(targetTime[1]) - minu) <= 2) {
        return true;
    } else {
        return false;
    }
}
//解锁
function unlock() {
    if (!device.isScreenOn()) {
        //点亮屏幕
        device.wakeUp();
        sleep(1000);
        //滑动屏幕到输入密码界面
        swipe(500, 1900, 500, 1000, 1000);
        sleep(1000);
        //输入四次 1 （密码为1111）其他密码请自行修改 
        //数字键1的像素坐标为（200,1000）
        click(200, 1000);
        sleep(300);
        //3
        click(700, 1000);
        sleep(300);
        //0
        click(400, 1600);
        sleep(300);
        //0
        click(400, 1600);
        sleep(300);
        //4
        click(200, 1200);
        sleep(300);
        //9
        click(700, 1400);
        sleep(300);

    }
}

/**
 * 设置按键监听 当脚本执行时候按音量减 退出脚本
 */
function registEvent() {
    //启用按键监听
    events.observeKey();
    //监听音量上键按下
    events.onKeyDown("volume_down", function(event) {
        tLog("脚本手动退出");
        exit();
    });
}
/**
 * 日志输出
 */
function tLog(msg) {
    toast(msg);
    console.log(msg);
}
/**
 * 检测系统版本。目前必须安卓7.0
 */
function checkVersion(){
    try {
        //打印版本号
        //tLog(app.verionName);
        //检测安卓的版本是否为7.0
        requiresApi(24);
        requiresAutojsVersion(435);
    } catch (error) {
        tLog("检测到版本不符合要求，程序将自动退出！");
        exit();
    }
    
}
/**
 * 获取权限和设置参数
 */
function prepareThings() {
    setScreenMetrics(1080, 1920);
    //请求截图
    if (!requestScreenCapture()) {
        tLog("请求截图失败");
        exit();
    }
}
/**
 * 获取截图
 */
function getCaptureImg() {
    var img0 = captureScreen();
    if (img0 == null || typeof(img0) == "undifined") {
        tLog("截图失败,退出脚本");
        exit();
    } else {
        return img0;
    }
}
/**
 * 默认程序出错提示操作
 */
function defaultException() {
    tLog("程序当前所处状态不合预期,脚本退出");
    exit();
}