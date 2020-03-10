$(function () {
    "use strict";
    jQuery.fn.searchAutocomplete = function (opt) {
        var el = this,
            cityId = opt.id,
            favoritesList = [],
            viewedList = [],
            lat = opt.lat,
            lng = opt.lng,
            type = opt.type;

        var getFavoritesItems = function() {
            if (opt.defaultList)
                favoritesList =  opt.defaultList.getItems().filter(function(item) {
                    return item.favorite === true
                });
            return function findMatches(q, cb) {
                if (q === '' && opt.defaultList)
                    cb(favoritesList || []);
                else
                    cb([]);
            };
        };

        var getViewedItems = function() {
            if (opt.defaultList)
                viewedList = opt.defaultList.getItems().filter(function(item) {
                    return item.favorite !== true
                });
            return function findMatches(q, cb) {
                if (q === '' && opt.defaultList)
                    cb(viewedList || []);
                else
                    cb([]);
            };
        };

        var getCountriesItems = function() {
            return function findMatches(q, cb) {
                var countriesList = [];
                var used = {};
                if (q === '' && opt.defaultList) {
                    countriesList = opt.defaultList.getItems().map(function (item) {return item.country});
                    countriesList = countriesList.filter(function (obj) {
                        return obj.id in used ? 0 : (used[ obj.id ] = 1);
                    })
                }
                cb(countriesList || []);
            };
        };

        var getGeoError = function() {
            return function findMatches(q, cb) {
                console.log(type);
                if (type === 'error') {
                    console.log(opt.error);
                    cb([ opt.error ]);
                }
                else
                    cb([]);
            }
        }

        return function () {
            el.typeahead(
                {
                    hint: true,
                    minLength: 0,
                    highlight: true
                },
                {
                    name: 'favorites',
                    display: 'value',
                    limit: favoritesList.length,
                    source: getFavoritesItems(),
                    templates: {
                        header: function(data) {
                            return '<div><h3>Мои пункты</h3></div>';
                        },
                        suggestion: function(data) {
                            return [
                                '<div>',
                                '<a href="#" class="star yellow" data-attr=\'' + JSON.stringify(data) + '\'></a>',
                                '<strong>' + data.id + '</strong>',
                                data.name,
                                '<a href="#" class="close" data-attr=\'' + JSON.stringify(data) + '\'></a>',
                                '</div>'
                            ].join('\n');
                        }
                    }
                },
                {
                    name: 'viewed',
                    source: getViewedItems(),
                    limit: viewedList.length,
                    display: 'value',
                    templates: {
                        header: function(data) {
                            return '<div><h3>Недавно просмотренные</h3></div>';
                        },
                        suggestion: function(data) {
                            return [
                                '<div>',
                                '<a href="#" class="star" data-attr=\'' + JSON.stringify(data) + '\'></a>',
                                '<strong>' + data.id + '</strong>',
                                data.name,
                                '<a href="#" class="close" data-attr=\'' + JSON.stringify(data) + '\'></a>',
                                '</div>'
                            ].join('\n');
                        }
                    }
                },
                {
                    name: 'cities',
                    source: function (query, qqq, process) {
                        if (opt.type !== 'geolocation' && opt.type !== 'error')
                            return $.ajax({
                                url: query === ''?('/listcache/lc_' + cityId + '.json'):('/sinpl?fchar=' + encodeURIComponent(query) + '&searchby=cities&mcntcities=8'),
                                type: 'GET',
                                dataType: 'json',
                                success: function (data) {
                                    var newData = []
                                    $.each(data.items, function () {
                                        var suggestion = {
                                            name: this.name,
                                            id: this.id
                                        }
                                        newData.push(suggestion)
                                    })
                                    return process(newData)
                                },
                                error: function () {
                                }
                            })
                    },
                    limit: 5, //'Infinity',
                    display: 'value',
                    templates: {
                        header: function(data) {
                            return data.query === ''?'<div><h3>Ближайшие пункты</h3></div>':'<div><h3>Найденные пункты</h3></div>'
                        },
                        suggestion: function(data) {
                            return '<div>' + (data.query === ''?'<span class="star"></span>':'') + '<strong>' + data.id + '</strong>, ' + data.name + '</div>';
                        },
                        notFound: '<div class="empty">По вашему запросу ничего не найдено</div><div class="all-result"><a href="#">Нет нужного пункта? Воспользуйтесь Мегапоиском</a></div>',
                    }
                },
                {
                    name: 'geo_cities',
                    source: function (query, qqq, process) {
                        if (opt.type === 'geolocation')
                            return $.ajax({
                                url: '/sinpl?searchby=nearby&lat=' + lat.replace('.', ',') + '&lng=' + lng.replace('.', ','),
                                type: 'GET',
                                dataType: 'json',
                                success: function (data) {
                                    var newData = []
                                    $.each(data.items, function () {
                                        var suggestion = {
                                            name: this.name,
                                            id: this.id
                                        }
                                        newData.push(suggestion)
                                    })
                                    return process(newData)
                                },
                                error: function () {
                                }
                            })
                         else {return process([])}
                    },
                    limit: 5, //'Infinity',
                    display: 'value',
                    templates: {
                        header: function(data) {
                            return '<div><h3>Ближайшие пункты</h3>'
                        },
                        suggestion: function(data) {
                            return '<div>' + (data.query === ''?'<span class="star"></span>':'') + '<strong>' + data.id + '</strong>, ' + data.name + '</div>';
                        },
                        notFound: '<div class="empty">По вашему запросу ничего не найдено</div><div class="all-result"><a href="#">Нет нужного пункта? Воспользуйтесь Мегапоиском</a></div>'
                    }
                },
                {
                    name: 'airports',
                    source: function (query, qqq, process) {
                        if (query !== '')
                            return $.ajax({
                                url: '/sinpl?fchar=' + encodeURIComponent(query) + '&searchby=airports&mcntcities=5',
                                type: 'GET',
                                dataType: 'json',
                                success: function (data) {
                                    var newData = []
                                    $.each(data.items, function () {
                                        var suggestion = {
                                            name: this.name,
                                            id: this.id
                                        }
                                        newData.push(suggestion)
                                    })
                                    return process(newData)
                                },
                                error: function () {
                                }
                            })
                    },
                    limit: 5,
                    display: 'value',
                    templates: {
                        header: '<div><h3>Найденные аэропорты</h3></div>',
                        suggestion: function(data) {
                            return '<div><strong>' + data.id + '</strong>, ' + data.name + '</div>';
                        },
                        footer: '<div class="all-result"><a href="#">Все результаты</a></div>'
                    }
                },
                {
                    name: 'countries',
                    source: getCountriesItems(),
                    limit: 3,
                    display: 'value',
                    templates: {
                        header: function(data) {
                            return '<div><h3>Страны</h3></div>';
                        },
                        suggestion: function(data) {
                            return '<div><strong>' + data.id + '</strong>, ' + data.name + '</div>';
                        }
                    }
                },
                {
                    name: 'error',
                    source: getGeoError,
                    limit: 1,
                    templates: {
                        suggestion: function(data) {
                            '<div class="empty">'+data+'</div><div class="all-result"><a href="#">Нет нужного пункта? Воспользуйтесь Мегапоиском</a></div>'
                        }
                    }
                }
            ).bind('typeahead:select', function (ev, suggestion) {
                //location.href = '/pogoda/' + suggestion.id
            }).bind('typeahead:active', function () {
                $(this).prop('placeholder', 'Поиск по городу');
            })

            $('.button.location').unbind('click').bind('click', function() {
                var $location = $(this)
                $location.addClass('loader_spinner');
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        el.typeahead('destroy');
                        el.searchAutocomplete({
                            type: 'geolocation',
                            lat: position.coords.latitude.toString(),
                            lng: position.coords.longitude.toString()
                        });
                        el.trigger('focus');
                        $location.removeClass('loader_spinner');
                    }, geoError, { enableHighAccuracy: true , timeout: 10 * 1000, maximumAge: 5 * 60 * 1000})
                }
                else {
                    geoError('Информация о ближайших пунктах временно недоступна. Браузер не поддерживает сервис геолокации')
                }
            })

            var geoError = function (error) {
                var strError = 'Информация о ближайших пунктах временно недоступна';
                var fError = function (error) {
                    console.log(error);
                    if (typeof error.code !== 'undefined') {
                        switch (error.code) {
                            case 0:
                                strError = 'Информация о ближайших пунктах временно недоступна. Попробуйте позже или воспользуйтесь поиском городов по первым буквам'
                                break
                            case 1:
                                strError = 'Вы запретили запрос за геоданными'
                                break
                            case 2:
                                strError = 'Информация о ближайших пунктах временно недоступна. Попробуйте позже или воспользуйтесь поиском городов по первым буквам'
                                break
                            case 3:
                                strError = 'Информация о ближайших пунктах временно недоступна. Попробуйте позже или воспользуйтесь поиском городов по первым буквам'
                                break
                        }
                    }
                }

                var script = document.createElement('script')
                script.type = 'text/javascript'
                script.src = 'js/geo.js'
                script.onload = function () {
                    if (geo_position_js.init()) {
                        geo_position_js.getCurrentPosition(function(position) {
                            el.typeahead('destroy');
                            el.searchAutocomplete({
                                type: 'geolocation',
                                lat: position.coords.latitude.toString(),
                                lng: position.coords.longitude.toString()
                            });
                            el.trigger('focus');
                        }, fError, { enableHighAccuracy: true , timeout: 10 * 1000, maximumAge: 5 * 60 * 1000 })
                    }
                    else {
                        fError();
                    }
                }
                document.getElementsByTagName('head')[0].appendChild(script);
            }

        }()
    }
});