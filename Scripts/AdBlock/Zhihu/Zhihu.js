const scriptName = "哲也同学";
const blockedUsersKey = "zhihu_blocked_users";
const currentUserInfoKey = "zhihu_current_userinfo";
const keywordBlockKey = "zhihu_keyword_block";
const blackAnswersIdKey = "zhihu_black_answers";
const userCreditScoreKey = "zhihu_credit_score";
const zheyeServerKey = "zheye_server_url";
const defaultAnswerBlockedUsers = ["会员推荐", "盐选推荐"];
const keywordMaxCount = 1e3;
const $ = MagicJS(scriptName, "INFO");
function getUserInfo() {
  let t = { id: "default", is_vip: false };
  try {
    let e = $.data.read(currentUserInfoKey);
    if (typeof e === "string") e = JSON.parse(e);
    if (!!e && e.hasOwnProperty("id")) {
      return e;
    } else {
      return t;
    }
  } catch (e) {
    $.logger.error(`获取用户信息出现异常：${e}`);
    return t;
  }
}
function modifyAppConfig() {
  let t = null;
  try {
    if (!!$.response.body) {
      let e = JSON.parse($.response.body);
      e["config"]["homepage_feed_tab"]["tab_infos"] = e["config"][
        "homepage_feed_tab"
      ]["tab_infos"].filter((e) => {
        if (e["tab_type"] === "activity_tab") {
          e["end_time"] = (new Date() - 12e4).toString().slice(0, 10);
          return true;
        } else {
          return false;
        }
      });
      e["config"]["zvideo_max_number"] = 1;
      e["config"]["is_show_followguide_alert"] = false;
      delete e["config"]["hp_channel_tab"];
      if (e["config"]["zombie_conf"]) {
        e["config"]["zombie_conf"]["zombieEnable"] = false;
      }
      if (e["config"]["gray_mode"]) {
        e["config"]["gray_mode"]["enable"] = false;
        e["config"]["gray_mode"]["start_time"] = "4092566400";
        e["config"]["gray_mode"]["end_time"] = "4092566400";
      }
      if (e["config"].hasOwnProperty("zhcnh_thread_sync")) {
        $.logger.debug(JSON.stringify(e["config"]["zhcnh_thread_sync"]));
        e["config"]["zhcnh_thread_sync"]["LocalDNSSetHostWhiteList"] = [];
        e["config"]["zhcnh_thread_sync"]["isOpenLocalDNS"] = "0";
        e["config"]["zhcnh_thread_sync"]["ZHBackUpIP_Switch_Open"] = "0";
        e["config"]["zhcnh_thread_sync"]["dns_ip_detector_operation_lock"] =
          "1";
        e["config"]["zhcnh_thread_sync"][
          "ZHHTTPSessionManager_setupZHHTTPHeaderField"
        ] = "1";
      }
      t = { body: JSON.stringify(e) };
    }
  } catch (e) {
    $.logger.error(`优化软件配置出现异常：${e}`);
  }
  return t;
}
function modifyMCloudConfig() {
  let t = null;
  try {
    if (!!$.response.body) {
      let e = JSON.parse($.response.body);
      if (e.data && e.data["configs"]) {
        e.data["configs"].forEach((e) => {
          if (e["configKey"] === "feed_gray_theme") {
            e["configValue"].start_time = "1669824000";
            e["configValue"].end_time = "1669824001";
            e.status = false;
          }
        });
      }
      const r = JSON.stringify(e);
      $.logger.debug(r);
      t = { body: r };
    }
  } catch (e) {
    $.logger.error(`优化软件配置出现异常：${e}`);
  }
  return t;
}
function unlockBlockedKeywords() {
  let i = null;
  try {
    const s = getUserInfo();
    if ($.request.method === "GET") {
      let e = $.data.read(keywordBlockKey, null, s.id);
      if (!e) {
        e = [];
      }
      let t = {
        "Cache-Control":
          "no-cache, no-store, must-revalidate, private, max-age=0",
        Connection: "keep-alive",
        "Content-Type": "application/json;charset=utf-8",
        Pragma: "no-cache",
        "Referrer-Policy": "no-referrer-when-downgrade",
        Server: "CLOUD ELB 1.0.0",
        Vary: "Accept-Encoding",
        "X-Cache-Lookup": "Cache Miss",
        "x-cdn-provider": "tencent",
      };
      let r = JSON.stringify({
        success: true,
        is_vip: true,
        kw_min_length: 2,
        kw_max_length: 100,
        kw_max_count: keywordMaxCount,
        data: e,
      });
      if ($.env.isQuanX) {
        i = { body: r, headers: t, status: "HTTP/1.1 200 OK" };
      } else {
        i = { response: { body: r, headers: t, status: 200 } };
      }
      $.logger.debug(`获取本地脚本屏蔽关键词：\n${e.join("、")}`);
    } else if ($.request.method === "POST") {
      if (!!$.request.body) {
        let t = {
          "Cache-Control":
            "no-cache, no-store, must-revalidate, private, max-age=0",
          Connection: "keep-alive",
          "Content-Type": "application/json;charset=utf-8",
          Pragma: "no-cache",
          "Referrer-Policy": "no-referrer-when-downgrade",
          Server: "CLOUD ELB 1.0.0",
          Vary: "Accept-Encoding",
          "X-Cache-Lookup": "Cache Miss",
          "x-cdn-provider": "tencent",
        };
        let r = decodeURIComponent($.request.body).match(/keyword=(.*)/)[1];
        let n = $.data.read(keywordBlockKey, null, s.id);
        if (!n) {
          n = [];
        }
        let o = false;
        for (let e = 0; e < n.length; e++) {
          if (r === n[e]) {
            o = true;
            break;
          }
        }
        if (o === false) {
          n.push(r);
          $.data.write(keywordBlockKey, n, s.id);
          let e = JSON.stringify({ success: true });
          if ($.env.isQuanX) {
            i = { body: e, headers: t, status: "HTTP/1.1 200 OK" };
          } else {
            i = { response: { body: e, headers: t, status: 200 } };
          }
          $.logger.debug(`添加本地脚本屏蔽关键词“${r}”`);
        } else {
          let e = JSON.stringify({
            error: { message: "关键词已存在", code: 100002 },
          });
          if ($.env.isQuanX) {
            i = { body: e, headers: t, status: "HTTP/1.1 400 Bad Request" };
          } else {
            i = { response: { body: e, headers: t, status: 400 } };
          }
        }
      }
    } else if ($.request.method === "DELETE") {
      let t = decodeURIComponent($.request.url).match(/keyword=(.*)/)[1];
      let e = $.data.read(keywordBlockKey, null, s.id);
      if (!e) {
        e = [];
      }
      e = e.filter((e) => {
        return e !== t;
      });
      $.data.write(keywordBlockKey, e, s.id);
      let r = {
        "Cache-Control":
          "no-cache, no-store, must-revalidate, private, max-age=0",
        Connection: "keep-alive",
        "Content-Type": "application/json;charset=utf-8",
        Pragma: "no-cache",
        "Referrer-Policy": "no-referrer-when-downgrade",
        Server: "CLOUD ELB 1.0.0",
        Vary: "Accept-Encoding",
        "X-Cache-Lookup": "Cache Miss",
        "x-cdn-provider": "tencent",
      };
      let n = JSON.stringify({ success: true });
      if ($.env.isQuanX) {
        i = { body: n, headers: r, status: "HTTP/1.1 200 OK" };
      } else {
        i = { response: { body: n, headers: r, status: 200 } };
      }
      $.logger.debug(`删除本地脚本屏蔽关键词：“${t}”`);
    }
  } catch (e) {
    $.logger.debug(`关键词屏蔽操作出现异常：${e}`);
  }
  return i;
}
function processUserInfo() {
  let t = null;
  try {
    let e = JSON.parse($.response.body);
    $.data.write(blackAnswersIdKey, []);
    $.logger.debug(`用户登录用户信息，接口响应：${$.response.body}`);
    if (
      e &&
      e["id"] &&
      e.hasOwnProperty("vip_info") &&
      e["vip_info"].hasOwnProperty("is_vip")
    ) {
      const r = {
        id: e["id"],
        is_vip: e["vip_info"]["is_vip"]
          ? e["vip_info"]["is_vip"] !== undefined
          : false,
      };
      $.logger.debug(
        `当前用户id：${e["id"]}，是否为VIP：${e["vip_info"]["is_vip"]}`
      );
      $.data.write(currentUserInfoKey, r);
      if (
        $.data.read("zhihu_settings_fake_vip") !== false &&
        e["vip_info"]["is_vip"] === false
      ) {
        e["vip_info"]["is_vip"] = true;
        e["vip_info"]["vip_type"] = 2;
        e["vip_info"]["vip_icon"] = {
          url: "https://picx.zhimg.com/v2-aa8a1823abfc46f14136f01d55224925.jpg?source=88ceefae",
          night_mode_url:
            "https://picx.zhimg.com/v2-aa8a1823abfc46f14136f01d55224925.jpg?source=88ceefae",
        };
        e["vip_info"]["vip_icon_v2"] = {
          url: "https://picx.zhimg.com/v2-aa8a1823abfc46f14136f01d55224925.jpg?source=88ceefae",
          night_mode_url:
            "https://picx.zhimg.com/v2-aa8a1823abfc46f14136f01d55224925.jpg?source=88ceefae",
        };
        e["vip_info"]["entrance"] = {
          icon: {
            url: "https://pic3.zhimg.com/v2-5b7012c8c22fd520f5677305e1e551bf.png",
            night_mode_url:
              "https://pic4.zhimg.com/v2-e51e3252d7a2cb016a70879defd5da0b.png",
          },
          title: "盐选会员 为你严选好内容",
          expires_day: "2099-12-31",
          sub_title: null,
          button_text: "首月 9 元",
          jump_url: "zhihu://vip/purchase",
          button_jump_url: "zhihu://vip/purchase",
          sub_title_new: null,
          identity: "super_svip",
        };
        e["vip_info"]["entrance_new"] = {
          left_button: {
            title: "精选会员内容",
            description: "为您严选好内容",
            jump_url: "zhihu://market/home",
          },
          right_button: {
            title: "开通盐选会员",
            description: "畅享 10w+ 场优质内容等特权",
            jump_url: "zhihu://vip/purchase",
          },
        };
        e["vip_info"]["entrance_v2"] = {
          title: "我的超级盐选会员",
          sub_title: "畅享 5000W+ 优质内容",
          jump_url: "zhihu://market/home",
          button_text: "查看会员",
          sub_title_color: "#F8E2C4",
          sub_title_list: ["畅享 5000W+ 优质内容"],
          card_jump_url: "zhihu://market/home",
        };
        $.logger.debug("设置用户为本地盐选会员");
        t = { body: JSON.stringify(e) };
      }
    } else {
      $.logger.warning(
        `没有获取到本次登录用户信息，如未对功能造成影响，请忽略此日志。`
      );
    }
  } catch (e) {
    $.logger.error(`获取当前用户信息出现异常：${e}`);
  }
  return t;
}
function manageBlackUser() {
  const r = getUserInfo();
  let t = {};
  let n = $.data.read(blockedUsersKey, "", r.id);
  n = typeof n === "object" && !!n ? n : {};
  defaultAnswerBlockedUsers.forEach((e) => {
    n[e] = "00000000000000000000000000000000";
    t[e] = "00000000000000000000000000000000";
  });
  $.logger.debug(`当前用户id：${r.id}，脚本黑名单：${JSON.stringify(n)}`);
  if ($.request.method === "GET") {
    try {
      if ($.request.url.indexOf("offset") < 0) {
        n = t;
        $.logger.debug(
          "脚本黑名单已清空，请滑动至黑名单末尾保证重新获取完成。"
        );
        $.notification.post(
          "开始同步黑名单数据，请滑动至黑名单末尾，直至弹出“同步成功”的通知。"
        );
      }
      let e = JSON.parse($.response.body);
      if (!!e["data"]) {
        $.logger.debug(
          `本次滑动获取的黑名单信息：${JSON.stringify(e["data"])}`
        );
        e["data"].forEach((e) => {
          if (e["name"] !== "[已重置]") {
            n[e["name"]] = e["id"];
          }
        });
        $.data.write(blockedUsersKey, n, r.id);
        if (e["paging"]["is_end"] === true) {
          $.notification.post(
            `同步黑名单数据成功！当前黑名单共${
              Object.keys(n).length - defaultAnswerBlockedUsers.length
            }人。\n脚本内置黑名单${defaultAnswerBlockedUsers.length}人。`
          );
          $.logger.debug(`脚本黑名单内容：${JSON.stringify(n)}。`);
        }
      } else {
        $.logger.warning(`获取黑名单失败，接口响应不合法：${$.response.body}`);
      }
    } catch (e) {
      $.data.del(blockedUsersKey);
      $.logger.error(`获取黑名单失败，异常信息：${e}`);
      $.notification.post("获取黑名单失败，执行异常，已清空黑名单。");
    }
  } else if ($.request.method === "POST") {
    try {
      let e = JSON.parse($.response.body);
      if (e.hasOwnProperty("name") && e.hasOwnProperty("id")) {
        $.logger.debug(
          `当前需要加入黑名单的用户Id：${e["id"]}，用户名：${e["name"]}`
        );
        if (e["id"]) {
          n[e["name"]] = e["id"];
          $.data.write(blockedUsersKey, n, r.id);
          $.logger.debug(
            `${
              e["name"]
            }写入脚本黑名单成功，当前脚本黑名单数据：${JSON.stringify(n)}`
          );
          $.notification.post(`已将用户“${e["name"]}”写入脚本黑名单。`);
        } else {
          $.logger.error(`${e["name"]}写入脚本黑名单失败，没有获取到用户Id。`);
          $.notification.post(`将用户“${e["name"]}”写入脚本黑名单失败！`);
        }
      } else {
        $.logger.warning(`写入黑名单失败，接口响应不合法：${$.response.body}`);
        $.notification.post("写入脚本黑名单失败，接口返回不合法。");
      }
    } catch (e) {
      $.logger.error(`写入黑名单失败，异常信息：${e}`);
      $.notification.post("写入脚本黑名单失败，执行异常，请查阅日志。");
    }
  } else if ($.request.method === "DELETE") {
    try {
      let e = JSON.parse($.response.body);
      if (e.success) {
        let t = $.request.url.match(
          /^https?:\/\/api\.zhihu\.com\/settings\/blocked_users\/([0-9a-zA-Z]*)/
        )[1];
        if (t) {
          $.logger.debug(`当前需要移出黑名单的用户Id：${t}`);
          for (let e in n) {
            if (n[e] === t) {
              delete n[e];
              $.data.write(blockedUsersKey, n, r.id);
              $.logger.debug(
                `${e}移出脚本黑名单成功，当前脚本黑名单数据：${JSON.stringify(
                  n
                )}`
              );
              $.notification.post(`已将用户“${e}”移出脚本黑名单！`);
              break;
            }
          }
        } else {
          $.logger.error(
            "将用户移出脚本黑名单失败！\n建议从设置中刷新黑名单数据。"
          );
          $.notification.post(
            `将用户移出脚本黑名单失败，没有获取到用户Id。\n建议从设置中刷新黑名单数据。`
          );
        }
      } else {
        $.logger.warning(`移出黑名单失败，接口响应不合法：${$.response.body}`);
        $.notification.post("移出脚本黑名单失败，接口返回不合法。");
      }
    } catch (e) {
      $.logger.error(`移出黑名单失败，异常信息：${e}`);
      $.notification.post("移出脚本黑名单失败，执行异常，请查阅日志。");
    }
  }
}
function autoInsertBlackList() {
  let e = null;
  try {
    let t = JSON.parse($.response.body);
    delete t["mcn_user_info"];
    e = { body: JSON.stringify(t) };
    if (t.name && t.id && t["is_blocking"] === true) {
      const r = getUserInfo();
      let e = $.data.read(blockedUsersKey, "", r.id);
      e = typeof e === "object" && !!e ? e : {};
      if (!e[t.name]) {
        $.logger.debug(
          `当前需要加入黑名单的用户Id：${t["id"]}，用户名：${t["name"]}`
        );
        e[t["name"]] = t["id"];
        $.data.write(blockedUsersKey, e, r.id);
        $.logger.debug(
          `${t["name"]}写入脚本黑名单成功，当前脚本黑名单数据：${JSON.stringify(
            e
          )}`
        );
        $.notification.post(`已自动将用户“${t["name"]}”写入脚本黑名单。`);
      }
    }
  } catch (e) {
    $.logger.error(`去除MCN信息出现异常：${e}`);
  }
  return e;
}
function removeMoments() {
  let r = null;
  try {
    let e = JSON.parse(
      $.response.body.replace(/(\w+"+\s?):\s?(\d{15,})/g, '$1:"$2"')
    );
    const n = getUserInfo();
    let i = $.data.read(blockedUsersKey, "", n.id);
    i = !!i ? i : {};
    let t;
    const s = $.data.read("zhihu_settings_moments_stream", false);
    const a = $.data.read("zhihu_settings_moments_recommend", false);
    const l = $.data.read("zhihu_settings_moments_activity", false);
    const c = $.data.read("zhihu_settings_blocked_users", false);
    t = e.data.filter((e) => {
      const t =
        c &&
        e.target &&
        e.target["origin_pin"] &&
        e.target["origin_pin"].author &&
        typeof i[e.target["origin_pin"].author.name] != "undefined";
      const r = s && e["target_type"] === "zvideo";
      const n = a && e.type === "recommend_user_card_list";
      const o = l && e.type === "message_activity_card";
      return !(t || r || n || o);
    });
    e["data"] = t;
    r = { body: JSON.stringify(e) };
  } catch (e) {
    $.logger.error(`关注列表去广告出现异常：${e}`);
  }
  return r;
}
function _setRecommendTag(e, t, r = "GBK02A") {
  if (!e["common_card"]["footline"]) {
    e["common_card"]["footline"] = { elements: [] };
  }
  e["common_card"]["footline"]["elements"].unshift({
    tag: { text: t, color: r, type: "MASK_ROUNDED_RECTANGLE" },
  });
}
async function _checkPaidContentByCloud(e, n) {
  const t = $.data.read(zheyeServerKey);
  if (!t) {
    $.notification.post(
      "未设置服务端地址，无法进行付费/推广内容探测。\n请配置服务端地址，或使用本地探测。"
    );
  } else {
    $.logger.debug(`向云端请求以下链接\n${e.join("\n")}`);
    const r = `${t}/api/v1/answer/links`;
    $.logger.debug(`服务端地址\n${r}`);
    await $.http
      .post({
        url: r,
        headers: { "Content-Type": "application/json" },
        body: e,
      })
      .then((r) => {
        $.logger.debug(
          `云端探测结果<${typeof r.body}>\n${JSON.stringify(r.body)}`
        );
        for (let t = 0; t < r.body.length; t++) {
          try {
            let e = r.body[t];
            if (e !== "") {
              _setRecommendTag(n[t], e, "GBK02A");
            }
          } catch (e) {
            $.logger.error(e);
          }
        }
      })
      .catch((e) => {
        $.logger.error(`云端请求出现异常\n${JSON.stringify(e)}`);
      });
  }
}
async function _checkPaidContentByLocal(n, o) {
  $.logger.debug(`将在本地请求以下链接\n${n.join("\n")}`);
  let t = [];
  function r(t) {
    return new Promise((r) => {
      const e = n[t];
      if (
        !e ||
        e === "" ||
        !e.startsWith("https://www.zhihu.com/appview/v2/answer")
      ) {
        r("");
      } else {
        $.http
          .get({ url: n[t], timeout: 1e3 })
          .then((e) => {
            const t = e.body;
            if (
              (t.indexOf("查看完整内容") >= 0 ||
                t.indexOf("查看全部章节") >= 0) &&
              t.indexOf("paid") >= 0
            ) {
              r("付费内容");
            } else if (
              t.indexOf("ad-link-card") >= 0 ||
              t.indexOf("xg.zhihu.com") >= 0 ||
              t.indexOf("营销平台") >= 0
            ) {
              r("营销推广");
            } else if (t.indexOf("mcn-link-card") >= 0) {
              r("购物推广");
            } else {
              r("");
            }
          })
          .catch((e) => {
            $.logger.error(`本地请求出现异常\n${JSON.stringify(e)}`);
            r("");
          });
      }
    });
  }
  for (let e = 0; e < n.length; e++) {
    t.push(r(e));
  }
  await Promise.all(t).then((r) => {
    $.logger.debug(`本地探测结果<${r.length}>\n${JSON.stringify(r)}`);
    for (let t = 0; t < r.length; t++) {
      try {
        let e = r[t];
        if (e !== "") {
          _setRecommendTag(o[t], e, "GBK02A");
        }
      } catch (e) {
        $.logger.error(e);
      }
    }
  });
}
async function removeRecommend() {
  let t = null;
  try {
    const g = $.data.read("zhihu_settings_recommend_pin", false);
    const p = $.data.read("zhihu_settings_recommend_stream", false);
    const h = $.data.read("zhihu_settings_remove_article", false);
    const y = $.data.read("zhihu_settings_blocked_users", false);
    const m = $.data.read("zhihu_settings_blocked_keywords", true);
    const r = $.data.read("zhihu_settings_check_paid_content", false);
    const o = $.data.read("zhihu_settings_request_content", "local");
    const i = getUserInfo();
    let u = $.data.read(keywordBlockKey, "", i.id);
    u = m && !!u ? u : [];
    let f = $.data.read(blockedUsersKey, "", i.id);
    f = y && !!f ? f : {};
    const s = (o) => {
      const e = JSON.stringify(o);
      const t =
        o["card_type"] === "slot_event_card" ||
        o["card_type"] === "slot_video_event_card" ||
        o.hasOwnProperty("ad") ||
        (o["brief"] && o["brief"].indexOf("slot_card") >= 0) ||
        (o["extra"] && o["extra"]["type"] === "Training");
      const r =
        t !== true &&
        e.search(/"(type|style)+"\s?:\s?"(drama|zvideo|Video|BIG_IMAGE)+"/i) >=
          0;
      const n = r && p;
      const i = r !== true && e.search(/"(type|style)+"\s?:\s?"pin"/i) >= 0;
      const s = i && g;
      const a = e.search(/"(type|style)+"\s?:\s?"article"/i) >= 0;
      const l = a && h;
      let c = false;
      if (r !== true && m) {
        for (let n = 0; n < u.length; n++) {
          if (e.search(u[n]) >= 0) {
            if ($.isDebug) {
              let e = o["common_card"]["feed_content"]["title"]["panel_text"];
              let t = o["common_card"]["feed_content"]["content"]["panel_text"];
              let r = "";
              try {
                r =
                  o["common_card"]["feed_content"]["title"]["action"][
                    "intent_url"
                  ];
              } catch {}
              $.logger.debug(
                `匹配关键字：\n${u[n]}\n标题：\n${e}\n内容：\n${t}`
              );
              $.notification.debug(
                scriptName,
                `关键字：${u[n]}`,
                `${e}\n${t}`,
                r
              );
            }
            c = true;
            break;
          }
        }
      }
      let d;
      try {
        d =
          c !== true &&
          y &&
          f &&
          o["common_card"]["feed_content"]["source_line"]["elements"][1][
            "text"
          ]["panel_text"] in f;
      } catch {
        d = false;
      }
      return !(t || s || l || n || c || d);
    };
    let e = JSON.parse(
      $.response.body.replace(/(\w+"+\s?):\s?(\d{15,})/g, '$1:"$2"')
    );
    let n = e["data"].filter(s);
    if (r === true) {
      let r = [];
      for (let t = 0; t < n.length; t++) {
        if (n[t]) {
          try {
            let e =
              n[t]["common_card"]["feed_content"]["title"]["action"][
                "intent_url"
              ];
            e = e.replace(
              /^https:\/\/zhihu\.com\/question\/\d+\/answer\//,
              "https://www.zhihu.com/appview/v2/answer/"
            );
            r.push(e);
          } catch {
            r.push("");
          }
        }
      }
      if (r.length > 0 && o === "cloud") {
        await _checkPaidContentByCloud(r, n);
      } else if (r.length > 0 && o === "local") {
        await _checkPaidContentByLocal(r, n);
      }
    }
    e["data"] = n;
    t = { body: JSON.stringify(e) };
  } catch (e) {
    $.logger.error(`推荐列表去广告出现异常：${e}`);
  }
  return t;
}
function removeQuestions() {
  let t = null;
  try {
    const r = getUserInfo();
    let n = $.data.read(blockedUsersKey, "", r.id);
    n = !!n ? n : {};
    let e = JSON.parse($.response.body);
    const i = $.data.read("zhihu_settings_blocked_users", false);
    $.logger.debug(`当前黑名单列表: ${JSON.stringify(n)}`);
    let o = $.data.read(blackAnswersIdKey, []);
    delete e["ad_info"];
    if (e["data"]) {
      let r = [];
      for (let t of e.data) {
        let e = "";
        const a = t.target.id.toString();
        try {
          if ("target" in t) {
            e = t["target"]["author"]["name"];
          }
        } catch (e) {
          $.logger.error(`获取回答列表用户名出现异常：${e}`);
        }
        const l = typeof n[e] != "undefined";
        const c = i && l;
        if ("target" in t) {
          t["target"]["visible_only_to_author"] = false;
          t["target"]["is_visible"] = true;
          t["target"]["is_copyable"] = true;
        }
        if (!c) {
          r.push(t);
        } else if (c === true && o.includes(a) === false) {
          o.push(a);
          $.notification.debug(`记录黑名单用户${e}的回答Id:${a}`);
        }
      }
      e.data = r;
    }
    $.data.write(blackAnswersIdKey, o);
    const s = JSON.stringify(e);
    $.logger.debug(`修改后的回答列表数据：${s}`);
    t = { body: s };
  } catch (e) {
    $.logger.error(`回答列表去广告出现异常：${e}`);
  }
  return t;
}
function modifyAnswer() {
  let r = null;
  try {
    let e = $.response.body;
    let t = "";
    if (
      (e.indexOf("查看完整内容") >= 0 || e.indexOf("查看全部章节") >= 0) &&
      e.indexOf("paid") >= 0
    ) {
      t =
        '<a style="height: 42px;padding: 0 12px;border-radius: 6px;background-color: rgb(247 104 104 / 8%);display: block;text-decoration: none;" href="#"><div style="color: #f36;display: flex;-webkit-box-align: center;align-items: center;height: 100%;"><svg style="width: 1.2em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024"><path d="M821.333333 138.666667c64.8 0 117.333333 52.533333 117.333334 117.333333v149.333333a32 32 0 0 1-32 32 74.666667 74.666667 0 0 0 0 149.333334 32 32 0 0 1 32 32v149.333333c0 64.8-52.533333 117.333333-117.333334 117.333333H202.666667c-64.8 0-117.333333-52.533333-117.333334-117.333333V618.666667a32 32 0 0 1 32-32 74.666667 74.666667 0 0 0 0-149.333334 32 32 0 0 1-32-32V256c0-64.8 52.533333-117.333333 117.333334-117.333333h618.666666zM428.576 329.994667a32 32 0 0 0-43.733333-2.581334l-1.514667 1.344a32 32 0 0 0-2.581333 43.733334L452.565333 458.666667H405.333333l-1.877333 0.053333A32 32 0 0 0 373.333333 490.666667l0.053334 1.877333A32 32 0 0 0 405.333333 522.666667h80v42.666666H405.333333l-1.877333 0.053334A32 32 0 0 0 373.333333 597.333333l0.053334 1.877334A32 32 0 0 0 405.333333 629.333333h80v42.666667l0.053334 1.877333A32 32 0 0 0 517.333333 704l1.877334-0.053333A32 32 0 0 0 549.333333 672v-42.666667H618.666667l1.877333-0.053333A32 32 0 0 0 650.666667 597.333333l-0.053334-1.877333A32 32 0 0 0 618.666667 565.333333h-69.333334v-42.666666H618.666667l1.877333-0.053334A32 32 0 0 0 650.666667 490.666667l-0.053334-1.877334A32 32 0 0 0 618.666667 458.666667h-47.253334l71.84-86.186667 1.248-1.589333a32 32 0 0 0-50.421333-39.381334L512 430.016l-82.08-98.506667z"></path></svg><div style="flex: 1 1;white-space: nowrap;text-overflow: ellipsis;padding-left:4px"><span style="font-family: -apple-system,BlinkMacSystemFont,Helvetica Neue,PingFang SC,Microsoft YaHei,Source Han Sans SC,Noto Sans CJK SC,WenQuanYi Micro Hei,sans-serif;-webkit-tap-highlight-color: rgba(26,26,26,0);font-size: 14px;line-height: 20px;color: #f36;white-space: nowrap;font-weight: 600;">本文为付费内容</span></div><div></div></div></a>';
    } else if (
      e.indexOf("ad-link-card") >= 0 ||
      e.indexOf("xg.zhihu.com") >= 0 ||
      e.indexOf("营销平台") >= 0
    ) {
      t =
        '<a style="height: 42px;padding: 0 12px;border-radius: 6px;background-color: rgb(8 188 212 / 8%);display: block;text-decoration: none;" href="#"><div style="color: #00bcd4;display: flex;-webkit-box-align: center;align-items: center;height: 100%;"><svg style="width: 1.2em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024"><path d="M128 765.952q0 26.624 18.432 45.056t45.056 18.432l191.488 0 0 128-254.976 0q-26.624 0-49.664-10.24t-40.448-27.648-27.648-40.448-10.24-49.664l0-637.952q0-25.6 10.24-49.152t27.648-40.448 40.448-27.136 49.664-10.24l701.44 0q26.624 0 49.664 10.24t40.448 27.136 27.648 40.448 10.24 49.152l0 251.904-128 1.024 0-61.44q0-26.624-18.432-45.056t-45.056-18.432l-574.464 0q-26.624 0-45.056 18.432t-18.432 45.056l0 382.976zM990.208 705.536q21.504 18.432 22.016 34.304t-20.992 33.28q-21.504 18.432-51.2 41.472t-60.928 48.128-61.952 49.152-55.296 43.52q-26.624 20.48-43.52 15.36t-16.896-31.744q1.024-16.384 0-40.448t-1.024-41.472q0-19.456-10.752-24.064t-31.232-4.608q-21.504 0-39.936-0.512t-35.84-0.512-36.352-0.512-41.472-0.512q-9.216 0-19.968-2.048t-19.456-7.168-14.336-15.36-5.632-27.648l0-80.896q0-31.744 15.36-42.496t48.128-10.752q30.72 1.024 61.44 1.024t71.68 1.024q29.696 0 46.08-5.12t16.384-25.6q-1.024-14.336 0.512-35.328t1.536-37.376q0-26.624 14.336-33.28t36.864 10.752q22.528 18.432 52.736 43.008t61.952 50.688 62.976 51.2 54.784 44.544z"></path></svg><div style="flex: 1 1;white-space: nowrap;text-overflow: ellipsis;padding-left:4px"><span style="font-family: -apple-system,BlinkMacSystemFont,Helvetica Neue,PingFang SC,Microsoft YaHei,Source Han Sans SC,Noto Sans CJK SC,WenQuanYi Micro Hei,sans-serif;-webkit-tap-highlight-color: rgba(26,26,26,0);font-size: 14px;line-height: 20px;color: #00bcd4;white-space: nowrap;font-weight: 600;">本文含有营销推广</span></div><div></div></div></a>';
    } else if (e.indexOf("mcn-link-card") >= 0) {
      t =
        '<a style="height: 42px;padding: 0 12px;border-radius: 6px;background-color: rgb(8 188 212 / 8%);display: block;text-decoration: none;" href="#"><div style="color: #00bcd4;display: flex;-webkit-box-align: center;align-items: center;height: 100%;"><svg style="width: 1.2em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024"><path d="M346.112 806.912q19.456 0 36.864 7.168t30.208 19.968 20.48 30.208 7.68 36.864-7.68 36.864-20.48 30.208-30.208 20.48-36.864 7.68q-20.48 0-37.888-7.68t-30.208-20.48-20.48-30.208-7.68-36.864 7.68-36.864 20.48-30.208 30.208-19.968 37.888-7.168zM772.096 808.96q19.456 0 37.376 7.168t30.72 19.968 20.48 30.208 7.68 36.864-7.68 36.864-20.48 30.208-30.72 20.48-37.376 7.68-36.864-7.68-30.208-20.48-20.48-30.208-7.68-36.864 7.68-36.864 20.48-30.208 30.208-19.968 36.864-7.168zM944.128 227.328q28.672 0 44.544 7.68t22.528 18.944 6.144 24.064-3.584 22.016-13.312 37.888-22.016 62.976-23.552 68.096-18.944 53.248q-13.312 40.96-33.28 56.832t-49.664 15.872l-35.84 0-65.536 0-86.016 0-96.256 0-253.952 0 14.336 92.16 517.12 0q49.152 0 49.152 41.984 0 20.48-9.728 35.328t-38.4 14.848l-49.152 0-94.208 0-118.784 0-119.808 0-99.328 0-55.296 0q-20.48 0-34.304-9.216t-23.04-24.064-14.848-32.256-8.704-32.768q-1.024-6.144-5.632-29.696t-11.264-58.88-14.848-78.848-16.384-87.552q-19.456-103.424-44.032-230.4l-76.8 0q-15.36 0-25.6-7.68t-16.896-18.432-9.216-23.04-2.56-22.528q0-20.48 13.824-33.792t37.376-13.312l21.504 0 21.504 0 25.6 0 34.816 0q20.48 0 32.768 6.144t19.456 15.36 10.24 19.456 5.12 17.408q2.048 8.192 4.096 23.04t4.096 30.208q3.072 18.432 6.144 38.912l700.416 0zM867.328 194.56l-374.784 0 135.168-135.168q23.552-23.552 51.712-24.064t51.712 23.04z"></path></svg><div style="flex: 1 1;white-space: nowrap;text-overflow: ellipsis;padding-left:4px"><span style="font-family: -apple-system,BlinkMacSystemFont,Helvetica Neue,PingFang SC,Microsoft YaHei,Source Han Sans SC,Noto Sans CJK SC,WenQuanYi Micro Hei,sans-serif;-webkit-tap-highlight-color: rgba(26,26,26,0);font-size: 14px;line-height: 20px;color: #00bcd4;white-space: nowrap;font-weight: 600;">本文含有购物推广</span></div><div></div></div></a>';
    } else if (Math.floor(Math.random() * 200) === 7) {
      t =
        '<a style="height: 42px;padding: 0 12px;border-radius: 6px;background-color: rgb(74 162 56 / 8%);display: block;text-decoration: none;" href="#"><div style="color: #619201;display: flex;-webkit-box-align: center;align-items: center;height: 100%;"><svg class="icon" style="width: 1.2em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024"><path d="M512 85.333333c71.477333 0 159.68 57.546667 229.258667 147.018667C817.845333 330.826667 864 455.978667 864 586.666667c0 211.808-148.501333 352-352 352S160 798.474667 160 586.666667c0-130.688 46.144-255.84 122.741333-354.314667C352.32 142.88 440.522667 85.333333 512 85.333333z m0 64c-48.213333 0-120.096 46.912-178.741333 122.314667C265.109333 359.253333 224 470.762667 224 586.666667c0 175.616 119.050667 288 288 288s288-112.384 288-288c0-115.904-41.109333-227.402667-109.258667-315.018667C632.096 196.234667 560.213333 149.333333 512 149.333333z m-74.666667 522.666667a53.333333 53.333333 0 1 1 0 106.666667 53.333333 53.333333 0 0 1 0-106.666667z m-96-128a42.666667 42.666667 0 1 1 0 85.333333 42.666667 42.666667 0 0 1 0-85.333333z"></path></svg><div style="flex: 1 1;white-space: nowrap;text-overflow: ellipsis;padding-left:4px"><span style="font-family: -apple-system,BlinkMacSystemFont,Helvetica Neue,PingFang SC,Microsoft YaHei,Source Han Sans SC,Noto Sans CJK SC,WenQuanYi Micro Hei,sans-serif;-webkit-tap-highlight-color: rgba(26,26,26,0);font-size: 14px;line-height: 20px;color: #619201;white-space: nowrap;font-weight: 600;">本文为免费内容</span></div><div></div></div></a>';
    }
    if (t !== "") {
      const n = e.match(/(richText[^<]*>)(.)/)[1];
      const o = e.lastIndexOf(n) + n.length;
      r = { body: e.slice(0, o) + t + e.slice(o) };
    }
  } catch (e) {
    $.logger.error(`付费内容提醒出现异常：${e}`);
  }
  return r;
}
function removeComment() {
  let e = null;
  try {
    if (!!$.response.body) {
      let t = JSON.parse($.response.body);
      t["ad_info"] = {};
      if ($.data.read("zhihu_settings_blocked_users", false) === true) {
        let e = getUserInfo();
        let s = $.data.read(blockedUsersKey, "", e.id);
        s = !!s ? s : {};
        let a = [];
        let l = {};
        if (typeof t.root != "undefined") {
          const n = t.root.author.name;
          const o = typeof s[n] != "undefined";
          if (o === true) {
            t.root.is_delete = true;
            t.root.can_reply = false;
            t.root.can_like = false;
            t.root.author.name = "黑名单用户";
            t.root.author.avatar_url =
              "https://picx.zhimg.com/v2-abed1a8c04700ba7d72b45195223e0ff_xll.jpg";
          }
        }
        if (typeof t.data != "undefined") {
          t.data.forEach((e) => {
            const t = e.author.name;
            let r = "";
            if (e["reply_to_author"] && e["reply_to_author"].name) {
              r = e["reply_to_author"].name;
            }
            const n = r !== "";
            const o = typeof s[t] != "undefined";
            const i = typeof s[r] != "undefined";
            if (o === true || i === true) {
              if (o && !n && $.request.url.indexOf("root_comment") > 0) {
                $.notification.debug(`屏蔽黑名单用户“${t}”的主评论。`);
              } else if (
                !o &&
                n &&
                !i &&
                $.request.url.indexOf("child_comment") > 0
              ) {
                $.notification.debug(`屏蔽黑名单用户“${t}”的子评论。`);
              } else if (
                o &&
                !i &&
                $.request.url.indexOf("child_comment") > 0
              ) {
                $.notification.debug(
                  `屏蔽黑名单用户“${t}”回复“${r}”的子评论。`
                );
              } else if (o && i && $.request.url.indexOf("child_comment") > 0) {
                $.notification.debug(
                  `屏蔽黑名单用户“${t}”回复黑名单用户“${r}”的子评论。`
                );
              }
              l[e.id] = t;
              if (o) {
                e.is_delete = true;
                e.can_reply = false;
                e.can_like = false;
                e.author.exposed_medal = {};
                e.author.name = "[黑名单用户]";
                e.author.avatar_url =
                  "https://picx.zhimg.com/v2-abed1a8c04700ba7d72b45195223e0ff_xll.jpg";
              }
              if (i) {
                e["reply_to_author"].name = "[黑名单用户]";
                e["reply_to_author"].exposed_medal = {};
                e["reply_to_author"].avatar_url =
                  "https://picx.zhimg.com/v2-abed1a8c04700ba7d72b45195223e0ff_xll.jpg";
              }
            }
            if (e.child_comments) {
              let i = [];
              e.child_comments.forEach((e) => {
                const t = e.author.name;
                const r =
                  typeof e["reply_to_author"] != "undefined"
                    ? e["reply_to_author"].name
                    : "";
                const n = typeof s[t] != "undefined";
                const o = typeof s[r] != "undefined";
                if (n || o) {
                  if (n === true) {
                    $.notification.debug(`屏蔽黑名单用户“${t}”的子评论。`);
                    l[e.id] = t;
                    e.is_delete = true;
                    e.can_reply = false;
                    e.can_like = false;
                    e.author.name = "[黑名单用户]";
                    e.author.exposed_medal = {};
                    e.author.avatar_url =
                      "https://picx.zhimg.com/v2-abed1a8c04700ba7d72b45195223e0ff_xll.jpg";
                  }
                  if (o === true) {
                    $.logger.debug(`修改前的子评论数据:\n${JSON.stringify(e)}`);
                    e["reply_to_author"].name = "[黑名单用户]";
                    e["reply_to_author"].exposed_medal = {};
                    e["reply_to_author"].avatar_url =
                      "https://picx.zhimg.com/v2-abed1a8c04700ba7d72b45195223e0ff_xll.jpg";
                    $.notification.debug(
                      `隐藏“${t}”回复黑名单用户“${r}”的名称与头像。`
                    );
                    $.logger.debug(`修改后的子评论数据:\n${JSON.stringify(e)}`);
                  }
                }
                i.push(e);
              });
              e.child_comments = i;
            }
            a.push(e);
          });
        }
        t.data = a;
      }
      const r = JSON.stringify(t);
      $.logger.debug(`过滤后的评论数据：\n${r}`);
      e = { body: r };
    }
  } catch (e) {
    $.logger.error(`去除评论广告出现异常：${e}`);
  }
  return e;
}
function removeArticleAd() {
  let t = null;
  try {
    if (!!$.response.body) {
      let e = JSON.parse($.response.body);
      e["ad_info"] = {};
      const r = JSON.stringify(e);
      $.logger.debug(`过滤后的文章数据：\n${r}`);
      t = { body: r };
    }
  } catch (e) {
    $.logger.error(`去除文章广告出现异常：${e}`);
  }
  return t;
}
function removeMarketingMsg() {
  let t = null;
  try {
    let e = JSON.parse($.response.body);
    let r = [];
    for (let t of e["data"]) {
      if (t["detail_title"] === "官方帐号消息") {
        let e = t["unread_count"];
        if (e > 0) {
          t["content"]["text"] = "未读消息" + e + "条";
        } else {
          t["content"]["text"] = "全部消息已读";
        }
        t["is_read"] = true;
        t["unread_count"] = 0;
        r.push(t);
      } else if (t["detail_title"] !== "活动助手") {
        r.push(t);
      }
    }
    e["data"] = r;
    t = { body: JSON.stringify(e) };
  } catch (e) {
    $.logger.error(`屏蔽官方营销消息出现异常：${e}`);
  }
  return t;
}
function removeHotListAds() {
  let t = null;
  try {
    if (!!$.response.body) {
      let e = JSON.parse($.response.body);
      if ("data" in e) {
        e["data"] = e["data"].filter((e) => {
          return (
            e["type"] === "hot_list_feed" || e["type"] === "hot_list_feed_video"
          );
        });
      }
      t = { body: JSON.stringify(e) };
    }
  } catch (e) {
    $.logger.error(`去除热榜广告出现异常：${e}`);
  }
  return t;
}
function removeKeywordAds() {
  let t = null;
  try {
    if (!!$.response.body) {
      $.logger.debug(`预置关键字返回：${$.response.body}`);
      let e = JSON.parse($.response.body);
      if (e.hasOwnProperty("preset_words") && e["preset_words"]["words"]) {
        e["preset_words"]["words"] = e["preset_words"]["words"].filter((e) => {
          return e["type"] !== "ad";
        });
        t = { body: JSON.stringify(e) };
      }
    }
  } catch (e) {
    $.logger.error(`去除预置关键字广告出现异常：${e}`);
  }
  return t;
}
function removeNextBlackUserAnswer() {
  let t = null;
  try {
    if (!!$.response.body) {
      let e = JSON.parse($.response.body);
      const n = $.data.read(blackAnswersIdKey, []);
      if (n.length > 0) {
        let r = [];
        e.data.forEach((e) => {
          const t = n.includes(e.id.toString());
          if (t === false) {
            e.ad_info = { data: "" };
            r.push(e);
          } else {
            $.notification.debug(
              `屏蔽翻页过程中出现的黑名单用户回答Id:${e.id}`
            );
          }
        });
        for (let e = 0; e < r.length; e++) {
          if (r[e]["extra"] && r[e]["extra"]["question_index"]) {
            r[e]["extra"]["question_index"] = e + 1;
          }
          if (r[e]["strategy_info"]) {
            r[e]["strategy_info"]["global_index"] = e + 1;
            r[e]["strategy_info"]["strategy_index"] = e + 1;
          }
        }
        e.data = r;
      }
      t = { body: JSON.stringify(e) };
    }
  } catch (e) {
    $.logger.error(`屏蔽下翻黑名单用户的回答出现异常：${e}`);
  }
  return t;
}
function modifyAnswersNextData() {
  let o = null;
  try {
    if (!!$.response.body) {
      let e = JSON.parse($.response.body);
      let t = getUserInfo();
      let r = $.data.read(blockedUsersKey, {}, t.id);
      $.logger.debug(`脚本黑名单用户：\n${JSON.stringify(r)}`);
      let n = [];
      e.data.data.forEach((e) => {
        e["ad_info"] = { data: "" };
        const t = typeof r[e.data.author.name] != "undefined";
        $.logger.debug(`用户${e.data.author.name}是否在黑名单中：${t}`);
        if (
          $.data.read("zhihu_settings_blocked_users", false) === false ||
          t === false
        ) {
          n.push(e);
        }
      });
      e.data.data = n;
      o = { body: JSON.stringify(e) };
    }
  } catch (e) {
    $.logger.error(`屏蔽回答信息流黑名单用户及广告：${e}`);
  }
  return o;
}
function changeUserCredit() {
  $.notification.debug("开始修改用户盐值");
  let t = null;
  try {
    if (!!$.response.body) {
      const r = parseInt($.data.read(userCreditScoreKey, 780));
      $.logger.debug(`准备修改用户盐值为${r}`);
      let e = JSON.parse($.response.body);
      if (e["credit_basis"].total_score < r) {
        e["credit_basis"].total_score = r;
        $.logger.debug(`已修改用户盐值为:${r}`);
      }
      t = { body: JSON.stringify(e) };
    }
  } catch (e) {
    $.logger.error(`修改用户盐值出现异常：${e}`);
  }
  return t;
}
(async () => {
  let e = null;
  if ($.isResponse) {
    switch (true) {
      case /^https:\/\/api\.zhihu\.com\/people\/self$/.test($.request.url):
        e = processUserInfo();
        break;
      case $.data.read("zhihu_settings_app_conf", false) === true &&
        /^https?:\/\/appcloud2\.zhihu\.com\/v\d+\/config/.test($.request.url):
        e = modifyAppConfig();
        break;
      case $.data.read("zhihu_settings_app_conf", false) === true &&
        /^https?:\/\/m-cloud\.zhihu\.com\/api\/cloud\/config\/all\?/.test(
          $.request.url
        ):
        e = modifyMCloudConfig();
        break;
      case /^https?:\/\/api\.zhihu\.com\/user-credit\/basis/.test(
        $.request.url
      ):
        e = changeUserCredit();
        break;
      case /^https:\/\/api\.zhihu\.com\/topstory\/recommend/.test(
        $.request.url
      ):
        e = await removeRecommend();
        break;
      case /^https?:\/\/api\.zhihu\.com\/(v4\/)?questions\/\d+/.test(
        $.request.url
      ):
        e = removeQuestions();
        break;
      case /^https?:\/\/api\.zhihu\.com\/next-data\?/.test($.request.url):
        e = modifyAnswersNextData();
        break;
      case $.data.read("zhihu_settings_sys_msg", true) !== false &&
        /^https?:\/\/api\.zhihu\.com\/notifications\/v3\/message/.test(
          $.request.url
        ):
        e = removeMarketingMsg();
        break;
      case /^https?:\/\/api\.zhihu\.com\/comment_v5\/(answers|pins|comments?|articles)\/\d+\/(root|child)_comment/.test(
        $.request.url
      ):
        e = removeComment();
        break;
      case /^https?:\/\/www\.zhihu\.com\/api\/v\d\/articles\/\d+\/recommendation\?/.test(
        $.request.url
      ):
        e = removeArticleAd();
        break;
      case /^https?:\/\/www\.zhihu\.com\/api\/v4\/comment_v5\/answers\/\d+\/abstract_comment\?/.test(
        $.request.url
      ):
        e = removeComment();
        break;
      case $.data.read("zhihu_settings_answer_tip", true) === true &&
        /^https?:\/\/www\.zhihu\.com\/appview\/v2\/answer\/.*(entry=(?!(preload-topstory|preload-search|preload-subscription)))?/.test(
          $.request.url
        ):
        e = modifyAnswer();
        break;
      case $.data.read("zhihu_settings_blocked_users", false) !== false &&
        /^https?:\/\/api\.zhihu\.com\/next\?/.test($.request.url):
        e = removeNextBlackUserAnswer();
        break;
      case $.data.read("zhihu_settings_blocked_users", true) === true &&
        /^https?:\/\/api\.zhihu\.com\/people\/((?!self).)*$/.test(
          $.request.url
        ):
        e = autoInsertBlackList();
        break;
      case /^https?:\/\/api\.zhihu\.com\/moments_v3\?/.test($.request.url):
        e = removeMoments();
        break;
      case $.data.read("zhihu_settings_hot_list", true) === true &&
        /^https?:\/\/api\.zhihu\.com\/topstory\/hot-lists(\?|\/)/.test(
          $.request.url
        ):
        e = removeHotListAds();
        break;
      case $.data.read("zhihu_settings_preset_words", true) === true &&
        /^https?:\/\/api\.zhihu\.com\/search\/preset_words\?/.test(
          $.request.url
        ):
        e = removeKeywordAds();
        break;
      case $.data.read("zhihu_settings_blocked_users", false) !== false &&
        /^https?:\/\/api\.zhihu\.com\/settings\/blocked_users/.test(
          $.request.url
        ):
        manageBlackUser();
        break;
      default:
        $.logger.debug("没有匹配到任何请求，请确认配置正确。");
        break;
    }
  } else if ($.isRequest) {
    if (
      $.data.read("zhihu_settings_blocked_keywords", false) !== false &&
      /^https?:\/\/api\.zhihu\.com\/feed-root\/block/.test($.request.url) ===
        true
    ) {
      e = unlockBlockedKeywords(e);
    }
  } else {
    $.data.del(currentUserInfoKey);
    $.data.del(blockedUsersKey);
    $.data.del(keywordBlockKey);
    $.notification.post("哲也同学数据清理完毕");
  }
  if (e) {
    $.done(e);
  } else {
    $.done();
  }
})();
function MagicJS(e = "MagicJS", t = "INFO") {
  const n = () => {
    const e = typeof $loon !== "undefined";
    const t = typeof $task !== "undefined";
    const r = typeof module !== "undefined";
    const n = typeof $httpClient !== "undefined" && !e;
    const o = typeof $storm !== "undefined";
    const i =
      typeof $environment !== "undefined" &&
      typeof $environment["stash-build"] !== "undefined";
    const s = n || e || o || i;
    const a = typeof importModule !== "undefined";
    return {
      isLoon: e,
      isQuanX: t,
      isNode: r,
      isSurge: n,
      isStorm: o,
      isStash: i,
      isSurgeLike: s,
      isScriptable: a,
      get name() {
        if (e) {
          return "Loon";
        } else if (t) {
          return "QuantumultX";
        } else if (r) {
          return "NodeJS";
        } else if (n) {
          return "Surge";
        } else if (a) {
          return "Scriptable";
        } else {
          return "unknown";
        }
      },
      get build() {
        if (n) {
          return $environment["surge-build"];
        } else if (i) {
          return $environment["stash-build"];
        } else if (o) {
          return $storm.buildVersion;
        }
      },
      get language() {
        if (n || i) {
          return $environment["language"];
        }
      },
      get version() {
        if (n) {
          return $environment["surge-version"];
        } else if (i) {
          return $environment["stash-version"];
        } else if (o) {
          return $storm.appVersion;
        } else if (r) {
          return process.version;
        }
      },
      get system() {
        if (n) {
          return $environment["system"];
        } else if (r) {
          return process.platform;
        }
      },
      get systemVersion() {
        if (o) {
          return $storm.systemVersion;
        }
      },
      get deviceName() {
        if (o) {
          return $storm.deviceName;
        }
      },
    };
  };
  const o = (r, e = "INFO") => {
    let n = e;
    const o = {
      SNIFFER: 6,
      DEBUG: 5,
      INFO: 4,
      NOTIFY: 3,
      WARNING: 2,
      ERROR: 1,
      CRITICAL: 0,
      NONE: -1,
    };
    const i = {
      SNIFFER: "",
      DEBUG: "",
      INFO: "",
      NOTIFY: "",
      WARNING: "❗ ",
      ERROR: "❌ ",
      CRITICAL: "❌ ",
      NONE: "",
    };
    const t = (e, t = "INFO") => {
      if (!(o[n] < o[t.toUpperCase()]))
        console.log(`[${t}] [${r}]\n${i[t.toUpperCase()]}${e}\n`);
    };
    const s = (e) => {
      n = e;
    };
    return {
      getLevel: () => {
        return n;
      },
      setLevel: s,
      sniffer: (e) => {
        t(e, "SNIFFER");
      },
      debug: (e) => {
        t(e, "DEBUG");
      },
      info: (e) => {
        t(e, "INFO");
      },
      notify: (e) => {
        t(e, "NOTIFY");
      },
      warning: (e) => {
        t(e, "WARNING");
      },
      error: (e) => {
        t(e, "ERROR");
      },
      retry: (e) => {
        t(e, "RETRY");
      },
    };
  };
  return new (class {
    constructor(e, t) {
      this._startTime = Date.now();
      this.version = "3.0.0";
      this.scriptName = e;
      this.env = n();
      this.logger = o(e, t);
      this.http =
        typeof MagicHttp === "function"
          ? MagicHttp(this.env, this.logger)
          : undefined;
      this.data =
        typeof MagicData === "function"
          ? MagicData(this.env, this.logger)
          : undefined;
      this.notification =
        typeof MagicNotification === "function"
          ? MagicNotification(this.scriptName, this.env, this.logger, this.http)
          : undefined;
      this.utils =
        typeof MagicUtils === "function"
          ? MagicUtils(this.env, this.logger)
          : undefined;
      this.qinglong =
        typeof MagicQingLong === "function"
          ? MagicQingLong(this.env, this.data, this.logger)
          : undefined;
      if (typeof this.data !== "undefined") {
        let e = this.data.read("magic_loglevel");
        const r = this.data.read("magic_bark_url");
        if (e) {
          this.logger.setLevel(e.toUpperCase());
        }
        if (r) {
          this.notification.setBark(r);
        }
      }
    }
    get isRequest() {
      return (
        typeof $request !== "undefined" && typeof $response === "undefined"
      );
    }
    get isResponse() {
      return typeof $response !== "undefined";
    }
    get isDebug() {
      return this.logger.level === "DEBUG";
    }
    get request() {
      return typeof $request !== "undefined" ? $request : undefined;
    }
    get response() {
      if (typeof $response !== "undefined") {
        if ($response.hasOwnProperty("status"))
          $response["statusCode"] = $response["status"];
        if ($response.hasOwnProperty("statusCode"))
          $response["status"] = $response["statusCode"];
        return $response;
      } else {
        return undefined;
      }
    }
    done = (e = {}) => {
      this._endTime = Date.now();
      let t = (this._endTime - this._startTime) / 1e3;
      this.logger.info(`SCRIPT COMPLETED: ${t} S.`);
      if (typeof $done !== "undefined") {
        $done(e);
      }
    };
  })(e, t);
}
function MagicNotification(i, s, a, l) {
  let c = null;
  let d = null;
  const e = (t) => {
    try {
      let e = t.replace(/\/+$/g, "");
      c = `${/^https?:\/\/([^/]*)/.exec(e)[0]}/push`;
      d = /\/([^\/]+)\/?$/.exec(e)[1];
    } catch (e) {
      a.error(`Bark url error: ${e}.`);
    }
  };
  function t(e = i, t = "", r = "", n = "") {
    const o = (r) => {
      try {
        let t = {};
        if (typeof r === "string") {
          if (s.isLoon) t = { openUrl: r };
          else if (s.isQuanX) t = { "open-url": r };
          else if (s.isSurge) t = { url: r };
        } else if (typeof r === "object") {
          if (s.isLoon) {
            t["openUrl"] = !!r["open-url"] ? r["open-url"] : "";
            t["mediaUrl"] = !!r["media-url"] ? r["media-url"] : "";
          } else if (s.isQuanX) {
            t = !!r["open-url"] || !!r["media-url"] ? r : {};
          } else if (s.isSurge) {
            let e = r["open-url"] || r["openUrl"];
            t = e ? { url: e } : {};
          }
        }
        return t;
      } catch (e) {
        a.error(`通知选项转换失败${e}`);
      }
      return r;
    };
    n = o(n);
    if (arguments.length === 1) {
      e = i;
      (t = ""), (r = arguments[0]);
    }
    a.notify(
      `title:${e}\nsubTitle:${t}\nbody:${r}\noptions:${
        typeof n === "object" ? JSON.stringify(n) : n
      }`
    );
    if (s.isSurge) {
      $notification.post(e, t, r, n);
    } else if (s.isLoon) {
      if (!!n) $notification.post(e, t, r, n);
      else $notification.post(e, t, r);
    } else if (s.isQuanX) {
      $notify(e, t, r, n);
    }
    if (c && d) {
      u(e, t, r);
    }
  }
  function r(e = i, t = "", r = "", n = "") {
    if (a.getLevel() === "DEBUG") {
      if (arguments.length === 1) {
        e = i;
        t = "";
        r = arguments[0];
      }
      this.post(e, t, r, n);
    }
  }
  function u(e = i, t = "", r = "", n = "") {
    if (typeof l === "undefined" || typeof l.post === "undefined") {
      throw "Bark notification needs to import MagicHttp module.";
    }
    let o = {
      url: c,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: { title: e, body: t ? `${t}\n${r}` : r, device_key: d },
    };
    l.post(o).catch((e) => {
      a.error(`Bark notify error: ${e}`);
    });
  }
  return { post: t, debug: r, bark: u, setBark: e };
}
function MagicData(s, a) {
  let l = { fs: undefined, data: {} };
  if (s.isNode) {
    l.fs = require("fs");
    try {
      l.fs.accessSync(
        "./magic.json",
        l.fs.constants.R_OK | l.fs.constants.W_OK
      );
    } catch (e) {
      l.fs.writeFileSync("./magic.json", "{}", { encoding: "utf8" });
    }
    l.data = require("./magic.json");
  }
  const c = (e, t) => {
    if (typeof t === "object") {
      return false;
    } else {
      return e === t;
    }
  };
  const d = (e) => {
    if (e === "true") {
      return true;
    } else if (e === "false") {
      return false;
    } else if (typeof e === "undefined") {
      return null;
    } else {
      return e;
    }
  };
  const u = (e, t, r, n) => {
    if (r) {
      try {
        if (typeof e === "string") e = JSON.parse(e);
        if (e["magic_session"] === true) {
          e = e[r];
        } else {
          e = null;
        }
      } catch {
        e = null;
      }
    }
    if (typeof e === "string" && e !== "null") {
      try {
        e = JSON.parse(e);
      } catch {}
    }
    if (n === false && !!e && e["magic_session"] === true) {
      e = null;
    }
    if (
      (e === null || typeof e === "undefined") &&
      t !== null &&
      typeof t !== "undefined"
    ) {
      e = t;
    }
    e = d(e);
    return e;
  };
  const i = (t) => {
    if (typeof t === "string") {
      let e = {};
      try {
        e = JSON.parse(t);
        const r = typeof e;
        if (
          r !== "object" ||
          e instanceof Array ||
          r === "bool" ||
          e === null
        ) {
          e = {};
        }
      } catch {}
      return e;
    } else if (
      t instanceof Array ||
      t === null ||
      typeof t === "undefined" ||
      t !== t ||
      typeof t === "boolean"
    ) {
      return {};
    } else {
      return t;
    }
  };
  const f = (e, t = null, r = "", n = false, o = null) => {
    let i = o || l.data;
    if (!!i && typeof i[e] !== "undefined" && i[e] !== null) {
      val = i[e];
    } else {
      val = !!r ? {} : null;
    }
    val = u(val, t, r, n);
    return val;
  };
  const g = (e, t = null, r = "", n = false, o = null) => {
    let i = "";
    if (o || s.isNode) {
      i = f(e, t, r, n, o);
    } else {
      if (s.isSurgeLike) {
        i = $persistentStore.read(e);
      } else if (s.isQuanX) {
        i = $prefs.valueForKey(e);
      }
      i = u(i, t, r, n);
    }
    a.debug(
      `READ DATA [${e}]${!!r ? `[${r}]` : ""} <${typeof i}>\n${JSON.stringify(
        i
      )}`
    );
    return i;
  };
  const p = (t, r, n = "", e = null) => {
    let o = e || l.data;
    o = i(o);
    if (!!n) {
      let e = i(o[t]);
      e["magic_session"] = true;
      e[n] = r;
      o[t] = e;
    } else {
      o[t] = r;
    }
    if (e !== null) {
      e = o;
    }
    return o;
  };
  const h = (e, t, r = "", n = null) => {
    if (typeof t === "undefined" || t !== t) {
      return false;
    }
    if (!s.isNode && (typeof t === "boolean" || typeof t === "number")) {
      t = String(t);
    }
    let o = "";
    if (n || s.isNode) {
      o = p(e, t, r, n);
    } else {
      if (!r) {
        o = t;
      } else {
        if (s.isSurgeLike) {
          o = !!$persistentStore.read(e) ? $persistentStore.read(e) : o;
        } else if (s.isQuanX) {
          o = !!$prefs.valueForKey(e) ? $prefs.valueForKey(e) : o;
        }
        o = i(o);
        o["magic_session"] = true;
        o[r] = t;
      }
    }
    if (!!o && typeof o === "object") {
      o = JSON.stringify(o, null, 4);
    }
    a.debug(
      `WRITE DATA [${e}]${r ? `[${r}]` : ""} <${typeof t}>\n${JSON.stringify(
        t
      )}`
    );
    if (!n) {
      if (s.isSurgeLike) {
        return $persistentStore.write(o, e);
      } else if (s.isQuanX) {
        return $prefs.setValueForKey(o, e);
      } else if (s.isNode) {
        try {
          l.fs.writeFileSync("./magic.json", o);
          return true;
        } catch (e) {
          a.error(e);
          return false;
        }
      }
    }
    return true;
  };
  const e = (t, r, n, o = c, i = null) => {
    r = d(r);
    const e = g(t, null, n, false, i);
    if (o(e, r) === true) {
      return false;
    } else {
      const s = h(t, r, n, i);
      let e = g(t, null, n, false, i);
      if (o === c && typeof e === "object") {
        return s;
      }
      return o(r, e);
    }
  };
  const y = (e, t, r) => {
    let n = r || l.data;
    n = i(n);
    if (!!t) {
      obj = i(n[e]);
      delete obj[t];
      n[e] = obj;
    } else {
      delete n[e];
    }
    if (!!r) {
      r = n;
    }
    return n;
  };
  const t = (e, t = "", r = null) => {
    let n = {};
    if (r || s.isNode) {
      n = y(e, t, r);
      if (!r) {
        l.fs.writeFileSync("./magic.json", JSON.stringify(n, null, 4));
      } else {
        r = n;
      }
    } else {
      if (!t) {
        if (s.isStorm) {
          return $persistentStore.remove(e);
        } else if (s.isSurgeLike) {
          return $persistentStore.write(null, e);
        } else if (s.isQuanX) {
          return $prefs.removeValueForKey(e);
        }
      } else {
        if (s.isSurgeLike) {
          n = $persistentStore.read(e);
        } else if (s.isQuanX) {
          n = $prefs.valueForKey(e);
        }
        n = i(n);
        delete n[t];
        const o = JSON.stringify(n, null, 4);
        h(e, o);
      }
    }
    a.debug(`DELETE KEY [${e}]${!!t ? `[${t}]` : ""}`);
  };
  const r = (e, t = null) => {
    let r = [];
    let n = g(e, null, null, true, t);
    n = i(n);
    if (n["magic_session"] !== true) {
      r = [];
    } else {
      r = Object.keys(n).filter((e) => e !== "magic_session");
    }
    a.debug(
      `READ ALL SESSIONS [${e}] <${typeof r}>\n${JSON.stringify(r, null, 4)}`
    );
    return r;
  };
  const n = (e, t = null) => {
    let r = {};
    let n = g(e, null, null, true, t);
    n = i(n);
    if (n["magic_session"] === true) {
      r = { ...n };
      delete r["magic_session"];
    }
    a.debug(
      `READ ALL SESSIONS [${e}] <${typeof r}>\n${JSON.stringify(r, null, 4)}`
    );
    return r;
  };
  return {
    read: g,
    write: h,
    del: t,
    update: e,
    allSessions: n,
    allSessionNames: r,
    defaultValueComparator: c,
    convertToObject: i,
  };
}
function MagicHttp(c, d) {
  let r;
  if (c.isNode) {
    const a = require("axios");
    r = a.create();
  }
  class e {
    constructor(e = true) {
      this.handlers = [];
      this.isRequest = e;
    }
    use(e, t, r) {
      if (typeof e === "function") {
        d.debug(`Register fulfilled ${e.name}`);
      }
      if (typeof t === "function") {
        d.debug(`Register rejected ${t.name}`);
      }
      this.handlers.push({
        fulfilled: e,
        rejected: t,
        synchronous:
          r && typeof r.synchronous === "boolean" ? r.synchronous : false,
        runWhen: r ? r.runWhen : null,
      });
      return this.handlers.length - 1;
    }
    eject(e) {
      if (this.handlers[e]) {
        this.handlers[e] = null;
      }
    }
    forEach(t) {
      this.handlers.forEach((e) => {
        if (e !== null) {
          t(e);
        }
      });
    }
  }
  function o(e) {
    let r = { ...e };
    if (!!r.params) {
      if (!c.isNode) {
        let e = Object.keys(r.params)
          .map((e) => {
            const t = encodeURIComponent(e);
            r.url = r.url.replace(new RegExp(`${e}=[^&]*`, "ig"), "");
            r.url = r.url.replace(new RegExp(`${t}=[^&]*`, "ig"), "");
            return `${t}=${encodeURIComponent(r.params[e])}`;
          })
          .join("&");
        if (r.url.indexOf("?") < 0) r.url += "?";
        if (!/(&|\?)$/g.test(r.url)) {
          r.url += "&";
        }
        r.url += e;
        delete r.params;
        d.debug(`Params to QueryString: ${r.url}`);
      }
    }
    return r;
  }
  const u = (e, t) => {
    let r =
      typeof t === "object" ? { headers: {}, ...t } : { url: t, headers: {} };
    if (!r.method) {
      r["method"] = e;
    }
    r = o(r);
    if (r["rewrite"] === true) {
      if (c.isSurge) {
        r.headers["X-Surge-Skip-Scripting"] = false;
        delete r["rewrite"];
      } else if (c.isQuanX) {
        r["hints"] = false;
        delete r["rewrite"];
      }
    }
    if (c.isSurgeLike) {
      const n = r.headers["content-type"] || r.headers["Content-Type"];
      if (
        r["method"] !== "GET" &&
        n &&
        n.indexOf("application/json") >= 0 &&
        r.body instanceof Array
      ) {
        r.body = JSON.stringify(r.body);
        d.debug(`Convert Array object to String: ${r.body}`);
      }
    } else if (c.isQuanX) {
      if (r.hasOwnProperty("body") && typeof r["body"] !== "string")
        r["body"] = JSON.stringify(r["body"]);
      r["method"] = e;
    } else if (c.isNode) {
      if (e === "POST" || e === "PUT" || e === "PATCH" || e === "DELETE") {
        r.data = r.data || r.body;
      } else if (e === "GET") {
        r.params = r.params || r.body;
      }
      delete r.body;
    }
    return r;
  };
  const f = (t, r = null) => {
    if (t) {
      let e = {
        ...t,
        config: t.config || r,
        status: t.statusCode || t.status,
        body: t.body || t.data,
        headers: t.headers || t.header,
      };
      if (typeof e.body === "string") {
        try {
          e.body = JSON.parse(e.body);
        } catch {}
      }
      delete e.data;
      return e;
    } else {
      return t;
    }
  };
  const t = (r) => {
    return Object.keys(r).reduce((e, t) => {
      e[t.toLowerCase()] = r[t];
      return e;
    }, {});
  };
  const n = (n) => {
    return Object.keys(n).reduce((e, t) => {
      const r = t
        .split("-")
        .map((e) => e[0].toUpperCase() + e.slice(1))
        .join("-");
      e[r] = n[t];
      return e;
    }, {});
  };
  const g = (e, t = null) => {
    if (!!e && e.status >= 400) {
      d.debug(`Raise exception when status code is ${e.status}`);
      return {
        name: "RequestException",
        message: `Request failed with status code ${e.status}`,
        config: t || e.config,
        response: e,
      };
    }
  };
  const i = { request: new e(), response: new e(false) };
  let p = [];
  let h = [];
  let y = true;
  function $(e) {
    e = o(e);
    d.debug(`HTTP ${e["method"].toUpperCase()}:\n${JSON.stringify(e)}`);
    return e;
  }
  function m(e) {
    try {
      e = !!e ? f(e) : e;
      d.sniffer(
        `HTTP ${e.config["method"].toUpperCase()}:\n${JSON.stringify(
          e.config
        )}\nSTATUS CODE:\n${e.status}\nRESPONSE:\n${
          typeof e.body === "object" ? JSON.stringify(e.body) : e.body
        }`
      );
      const t = g(e);
      if (!!t) {
        return Promise.reject(t);
      }
      return e;
    } catch (t) {
      d.error(t);
      return e;
    }
  }
  const _ = (t) => {
    try {
      p = [];
      h = [];
      i.request.forEach((e) => {
        if (typeof e.runWhen === "function" && e.runWhen(t) === false) {
          return;
        }
        y = y && e.synchronous;
        p.unshift(e.fulfilled, e.rejected);
      });
      i.response.forEach((e) => {
        h.push(e.fulfilled, e.rejected);
      });
    } catch (e) {
      d.error(`Failed to register interceptors: ${e}.`);
    }
  };
  const s = (e, n) => {
    let o;
    const t = e.toUpperCase();
    n = u(t, n);
    if (c.isNode) {
      o = r;
    } else {
      if (c.isSurgeLike) {
        o = (i) => {
          return new Promise((n, o) => {
            $httpClient[e.toLowerCase()](i, (t, r, e) => {
              if (t) {
                let e = {
                  name: t.name || t,
                  message: t.message || t,
                  stack: t.stack || t,
                  config: i,
                  response: f(r),
                };
                o(e);
              } else {
                r.config = i;
                r.body = e;
                n(r);
              }
            });
          });
        };
      } else {
        o = (o) => {
          return new Promise((r, n) => {
            $task
              .fetch(o)
              .then((e) => {
                e = f(e, o);
                const t = g(e, o);
                if (t) {
                  return Promise.reject(t);
                }
                r(e);
              })
              .catch((e) => {
                let t = {
                  name: e.message || e.error,
                  message: e.message || e.error,
                  stack: e.error,
                  config: o,
                  response: !!e.response ? f(e.response) : null,
                };
                n(t);
              });
          });
        };
      }
    }
    let i;
    _(n);
    const s = [$, undefined];
    const a = [m, undefined];
    if (!y) {
      d.debug("Interceptors are executed in asynchronous mode");
      let r = [o, undefined];
      Array.prototype.unshift.apply(r, s);
      Array.prototype.unshift.apply(r, p);
      r = r.concat(a);
      r = r.concat(h);
      i = Promise.resolve(n);
      while (r.length) {
        try {
          let e = r.shift();
          let t = r.shift();
          if (!c.isNode && n["timeout"] && e === o) {
            e = l;
          }
          if (typeof e === "function") {
            d.debug(`Executing request fulfilled ${e.name}`);
          }
          if (typeof t === "function") {
            d.debug(`Executing request rejected ${t.name}`);
          }
          i = i.then(e, t);
        } catch (e) {
          d.error(`request exception: ${e}`);
        }
      }
      return i;
    } else {
      d.debug("Interceptors are executed in synchronous mode");
      Array.prototype.unshift.apply(p, s);
      p = p.concat([$, undefined]);
      while (p.length) {
        let e = p.shift();
        let t = p.shift();
        try {
          if (typeof e === "function") {
            d.debug(`Executing request fulfilled ${e.name}`);
          }
          n = e(n);
        } catch (e) {
          if (typeof t === "function") {
            d.debug(`Executing request rejected ${t.name}`);
          }
          t(e);
          break;
        }
      }
      try {
        if (!c.isNode && n["timeout"]) {
          i = l(n);
        } else {
          i = o(n);
        }
      } catch (e) {
        return Promise.reject(e);
      }
      Array.prototype.unshift.apply(h, a);
      while (h.length) {
        i = i.then(h.shift(), h.shift());
      }
      return i;
    }
    function l(r) {
      try {
        const e = new Promise((e, t) => {
          setTimeout(() => {
            let e = {
              message: `timeout of ${r["timeout"]}ms exceeded.`,
              config: r,
            };
            t(e);
          }, r["timeout"]);
        });
        return Promise.race([o(r), e]);
      } catch (e) {
        d.error(`Request Timeout exception: ${e}.`);
      }
    }
  };
  return {
    request: s,
    interceptors: i,
    convertHeadersToLowerCase: t,
    convertHeadersToCamelCase: n,
    modifyResponse: f,
    get: (e) => {
      return s("GET", e);
    },
    post: (e) => {
      return s("POST", e);
    },
    put: (e) => {
      return s("PUT", e);
    },
    patch: (e) => {
      return s("PATCH", e);
    },
    delete: (e) => {
      return s("DELETE", e);
    },
    head: (e) => {
      return s("HEAD", e);
    },
    options: (e) => {
      return s("OPTIONS", e);
    },
  };
}
