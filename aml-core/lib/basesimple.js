/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */
define(["aml-core/standardbinding", "optional!aml", "lib-oop"], function(StandardBinding, aml, oop){

/**
 * Baseclass of a simple element. This are usually displaying elements 
 * (i.e. {@link element.label}, {@link element.picture})
 *
 * @constructor
 * @baseclass
 *
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
var BaseSimple = function(){
	StandardBinding.call(this, true);
};

oop.inherits(BaseSimple, StandardBinding);

oop.decorate(BaseSimple, DataAction);

(function() {
    
    this.getValue = function(){
        return this.value;
    };
    
}).call(BaseSimple.prototype);


return BaseSimple;

});